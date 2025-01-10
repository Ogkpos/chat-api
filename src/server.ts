import http from "http";
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket: Socket) => {
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
      console.log("Creating group with:", { creatorId, participantIds });

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
  socket.on(
    "sendMessage",
    async ({
      senderId,
      receiverId,
      conversationId,
      content,
      type = "DIRECT",
    }) => {
      try {
        const sender = await prisma.user.findUnique({
          where: { id: senderId },
        });

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
          // }
          if (!conversation) {
            console.log(
              "❌ No direct conversation found. Creating a new one..."
            );
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
        // Save message to database
        const message = await prisma.message.create({
          data: {
            senderId,
            conversationId: conversation!.id,
            content,
            receiverId: receiverIdFinal,
          },
          include: { sender: true, conversation: true }, //receiver: true
        });

        const messageToEmit = {
          id: message.id,
          senderId: message.senderId,
          sender: message.sender, // Sender details
          conversationId: message.conversationId,
          content: message.content,
          type: message.conversation.type, // ✅ Ensuring type is included
        };

        //EMit the message to the correct conversation room
        io.to(`conversation_${conversation?.id}`).emit(
          "newMessage",
          messageToEmit
        );
        console.log("📢 Emitting to:", `conversation_${conversation!.id}`);
        console.log("📤 Sending message:", messageToEmit);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("WebSocket server is running on port 3000");
});
