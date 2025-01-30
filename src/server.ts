import http from "http";
import fs from "fs";
import multer from "multer";
import { Server, Socket } from "socket.io";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./app";
// import jwt from "jsonwebtoken";
import { NotAuthorizedError } from "./errors/not-authorize-error";
import prisma from "./services/prisma-client";
import { BadRequestError } from "./errors/bad-request-error";
import { NotFoundError } from "./errors/not-found-error";
import { connect } from "socket.io-client";
import express from "express";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

export const onlineUsers = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadFolder = join(__dirname, "uploads");
app.use("/uploads", express.static(uploadFolder));

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

//configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + file.originalname);
  },
});

const notifyFriendsOnlineStatus = async (userId: any, isOnline: boolean) => {
  const friends = await prisma.friends.findMany({
    where: { OR: [{ userId1: userId }, { userId2: userId }] },
  });

  friends.forEach((friend) => {
    const friendId =
      friend.userId1 === userId ? friend.userId2 : friend.userId1;
    const friendSocketId = onlineUsers.get(friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit(isOnline ? "friendOnline" : "friendOffline", {
        userId,
      });
    }
  });
};

io.on("connection", async (socket: Socket) => {
  const userId = Array.isArray(socket.handshake.query.userId)
    ? socket.handshake.query.userId[0]
    : socket.handshake.query.userId;

  if (!userId) {
    console.error("❌ Missing userId in handshake query");
    return;
  }

  // Mark user as online
  onlineUsers.set(userId, socket.id);
  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: true },
  });

  await notifyFriendsOnlineStatus(userId, true);

  console.log(`User connected: ${socket.id}`);

  socket.on("joinConversations", async (userId: string) => {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
      });
      conversations.forEach((conv: { id: any }) => {
        socket.join(`conversation_${conv.id}`);
        console.log(`User ${userId} joined room conversation_${conv.id}`);
      });
    } catch (error) {
      console.error("Error joining user conversations:", error);
    }
  });

  //create a group chat
  socket.on("createGroupChat", async ({ creatorId, name, participantIds }) => {
    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      });
      const participants = await prisma.user.findMany({
        where: { id: { in: participantIds } },
      });

      if (!creator || participantIds.length < 2) {
        throw new BadRequestError(
          "A group must have at least 3 member(including the creator)"
        );
      }

      const users = await prisma.user.findMany({
        where: { id: { in: [creatorId, ...participantIds] } },
      });
      if (users.length !== participantIds.length + 1) {
        throw new BadRequestError("Some users do not exist.");
      }

      const conversation = await prisma.conversation.create({
        data: {
          name,
          type: "GROUP",
          participants: {
            create: [creatorId, ...participantIds].map((userId) => ({
              user: { connect: { id: userId } },
            })),
          },
        },
        include: { participants: true },
      });

      conversation.participants.forEach((participant) => {
        socket
          .to(`conversation_${participant.userId}`)
          .emit("newGroupCreated", {
            conversationId: conversation.id,
            name: conversation.name,
          });
      });
      console.log({ success: true, conversationId: conversation.id });
    } catch (error) {
      console.error("Error creating group chat:", error);
    }
  });

  // sending Message
  socket.on("sendMessage", async (data) => {
    try {
      const {
        senderId,
        receiverId,
        conversationId,
        content,
        type,
        file,
        fileName,
        fileType,
      } = data;

      let fileUrl: any = null;

      if (file) {
        console.log(
          `Received a file from ${senderId}: ${fileName} (${fileType})`
        );
        // Decode Base64 file content
        const buffer = Buffer.from(file.split(",")[1], "base64");

        // Save file to the server
        const uniqueFileName = `${Date.now()}-${fileName}`;
        const uploadPath = join(__dirname, "uploads", uniqueFileName);

        // Ensure upload directory exists
        if (!fs.existsSync(join(__dirname, "uploads"))) {
          fs.mkdirSync(join(__dirname, "uploads"));
        }

        fs.writeFileSync(uploadPath, buffer);

        fileUrl = `http://127.0.0.1:3000/src/uploads/${uniqueFileName}`;
      }

      let conversation;
      if (type === "DIRECT") {
        if (!receiverId) {
          throw new BadRequestError(
            "receiverId is required for direct messages."
          );
        }

        const areFriends = await prisma.friends.findFirst({
          where: {
            OR: [
              { userId1: senderId, userId2: receiverId },
              { userId1: receiverId, userId2: senderId },
            ],
          },
        });

        if (!areFriends) {
          throw new BadRequestError("You can only message friends.");
        }

        conversation = await prisma.conversation.findFirst({
          where: {
            type: "DIRECT",
            participants: {
              every: {
                userId: { in: [senderId, receiverId] },
              },
            },
          },
          include: { participants: true },
        });

        if (!conversation) {
          console.log("❌ No direct conversation found. Creating a new one...");
          conversation = await prisma.conversation.create({
            data: {
              type: "DIRECT",
              participants: {
                create: [
                  { user: { connect: { id: senderId } } },
                  { user: { connect: { id: receiverId } } },
                ],
              },
            },
            include: { participants: true },
          });
        }
      }
      if (type === "GROUP") {
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: true },
        });

        console.log("🔍 Found Group Conversation:", conversation);

        if (!conversation) {
          throw new BadRequestError("Group conversation not found.");
        }
      }

      // 🔹 Ensure sender is part of the conversation
      const isParticipant = conversation?.participants.some(
        (p) => p.userId === senderId
      );
      if (!isParticipant) {
        throw new BadRequestError(
          "User is not a participant in this conversation."
        );
      }

      // 🔹 Determine receiverId (only for direct chats)
      let receiverIdFinal = null;
      if (conversation?.type === "DIRECT") {
        const receiver = conversation.participants.find(
          (p) => p.userId !== senderId
        );
        receiverIdFinal = receiver?.userId || null;
      }

      const messageData: any = {
        senderId,
        conversationId: conversation!.id,
        content,
        receiverId: receiverIdFinal,
        type,
      };

      if (fileUrl) messageData.fileUrl = fileUrl;
      if (fileName) messageData.fileName = fileName;
      if (fileType) messageData.fileType = fileType;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          senderId,
          conversationId: conversation!.id,
          content,
          receiverId: receiverIdFinal,
          fileUrl,
          fileName,
          fileType,
          type,
        },
        include: { sender: true, conversation: true },
      });

      const messageToEmit = {
        id: message.id,
        senderId: message.senderId,
        sender: message.sender,
        conversationId: message.conversationId,
        content: message.content,
        type: message.conversation.type,
        fileUrl: message.fileUrl || null,
        fileName: message.fileName || null,
        fileType: message.fileType || null,
      };

      //EMit the message to the correct conversation room
      io.to(`conversation_${conversation?.id}`).emit(
        "newMessage",
        messageToEmit
      );
      console.log("📤 Sending message:", messageToEmit);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("disconnect", async () => {
    onlineUsers.delete(userId);
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });
    await notifyFriendsOnlineStatus(userId, false);
    console.log(`Disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("WebSocket server is running on port 3000");
});
