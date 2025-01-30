import express, { Request, Response } from "express";
import prisma from "../services/prisma-client";
import { BadRequestError } from "../errors/bad-request-error";
import { onlineUsers } from "../server";

export const fetchOnlineFriends = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const friends = await prisma.friends.findMany({
    where: {
      OR: [{ userId1: userId }, { userId2: userId }],
    },
    include: {
      user1: true,
      user2: true,
    },
  });

  const onlineFriends = friends
    .map((friend) => {
      const friendId =
        friend.userId1 === userId ? friend.userId2 : friend.userId1;
      return {
        id: friendId,
        name:
          friend.userId1 === userId
            ? friend.user2.username
            : friend.user1.username,
        isOnline: onlineUsers.has(friendId),
      };
    })
    .filter((friend) => friend.isOnline);
  res.send(onlineFriends);
};
