import express, { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";
import prisma from "../services/prisma-client";
import { NotFoundError } from "../errors/not-found-error";
import { BadRequestError } from "../errors/bad-request-error";
import { Password } from "../services/password";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password, username } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new BadRequestError("Email belongs to another user");
  }

  const hashedPassword = await Password.hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username,
    },
  });

  const token = jwt.sign(
    {
      id: newUser.id,
      username: newUser.username,
    },
    process.env.JWT_SECRET!
  );
  req.session = {
    jwt: token,
  };
  res.status(201).send({ newUser, token });
};
