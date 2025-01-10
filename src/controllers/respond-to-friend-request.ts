import express, { Request, Response, NextFunction } from "express";
import prisma from "../services/prisma-client";
import { BadRequestError } from "../errors/bad-request-error";

export const respondToFriendRequest = async (req: Request, res: Response) => {
  const receiverId = req.currentUser!.id;
  const { senderId, status } = req.body;

  const friendRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (!friendRequest || friendRequest.status !== "PENDING") {
    throw new BadRequestError("Friend request not found or already processed");
  }

  let updatedFriendRequest;

  if (status === "accept") {
    updatedFriendRequest = await prisma.friendRequest.update({
      where: {
        id: friendRequest.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    await prisma.friends.createMany({
      data: [
        {
          userId1: friendRequest.senderId,
          userId2: friendRequest.receiverId,
        },
        {
          userId1: friendRequest.receiverId,
          userId2: friendRequest.senderId,
        },
      ],
    });
  } else if (status === "decline") {
    updatedFriendRequest = await prisma.friendRequest.update({
      where: {
        id: friendRequest.id,
      },
      data: {
        status: "DECLINED",
      },
    });
  }
  res.send(updatedFriendRequest);
};
