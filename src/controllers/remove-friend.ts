import express, { Request, Response } from "express";
import prisma from "../services/prisma-client";
import { BadRequestError } from "../errors/bad-request-error";

export const removeFriend = async (req: Request, res: Response) => {
  const userId = req.currentUser!.id;
  const { friendId } = req.body;

  const friendship = await prisma.friends.findFirst({
    where: {
      OR: [
        { userId1: userId, userId2: friendId },
        { userId1: friendId, userId2: userId },
      ],
    },
  });

  if (!friendship) {
    throw new BadRequestError("You are not friends with this user.");
  }

  const directConversation = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      participants: {
        every: {
          userId: { in: [userId, friendId] },
        },
      },
    },
  });

  if (directConversation) {
    const conversationId = directConversation.id;

    await prisma.message.deleteMany({
      where: { conversationId },
    });

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId },
    });

    await prisma.conversation.deleteMany({
      where: { id: conversationId },
    });
  }

  await prisma.friends.deleteMany({
    where: {
      OR: [
        { userId1: userId, userId2: friendId },
        { userId1: friendId, userId2: userId },
      ],
    },
  });
  res.json({ message: "Friend removed successfully." });
};
