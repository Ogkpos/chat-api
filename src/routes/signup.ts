import { signup } from "../controllers/signup";
import { body } from "express-validator";
import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validate-request";
import prisma from "../services/prisma-client";

const router = express.Router();

router.post(
  "/api/users/signup",
  [
    body("email").isEmail().withMessage("Please provide a valid email address"),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters"),
    body("username").custom(async (username) => {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return Promise.reject("Username is already taken");
      }
    }),
  ],
  validateRequest,
  signup
);

export { router as signupRouter };
