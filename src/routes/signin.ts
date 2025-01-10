import { body } from "express-validator";
import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validate-request";
import prisma from "../services/prisma-client";
import { signin } from "../controllers/signin";

const router = express.Router();

router.post(
  "/api/users/signin",
  [body("password").trim().notEmpty().withMessage("Please provide a password")],
  validateRequest,
  signin
);

export { router as signinRouter };
