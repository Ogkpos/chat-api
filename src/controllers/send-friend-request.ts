import express, { Request, Response, NextFunction } from "express";
import prisma from "../services/prisma-client";
import { BadRequestError } from "../errors/bad-request-error";

export const sendFriendRequest = async (req: Request, res: Response) => {
  const { receiverId } = req.body;
  const senderId = req.currentUser!.id;

  if (senderId === receiverId) {
    throw new BadRequestError("You cannot send a friend request to yourself.");
  }
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });
  if (existingRequest) {
    throw new BadRequestError("Friend request already exists");
  }

  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
    },
  });

  res.status(201).send(friendRequest);
};
