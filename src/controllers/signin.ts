import jwt from "jsonwebtoken";
import { BadRequestError } from "../errors/bad-request-error";
import { NotFoundError } from "../errors/not-found-error";
import { Password } from "../services/password";
import prisma from "../services/prisma-client";
import express, { Request, Response, NextFunction } from "express";

export const signin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });
  if (!existingUser) {
    throw new BadRequestError("Invalid credentials");
  }

  const passwordMatch = await Password.comparePassword(
    existingUser.password,
    password
  );

  if (!passwordMatch) {
    throw new BadRequestError("Invalid credentials");
  }
  const token = jwt.sign(
    {
      id: existingUser.id,
      username: existingUser.username,
    },
    process.env.JWT_SECRET!
  );
  req.session = {
    jwt: token,
  };
  res.send(existingUser);
};
