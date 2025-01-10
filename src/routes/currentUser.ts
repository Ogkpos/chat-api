import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validate-request";
import prisma from "../services/prisma-client";
import { signin } from "../controllers/signin";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();

router.get(
  "/api/users/profile",
  requireAuth,
  async (req: Request, res: Response) => {
    res.send({ currentUser: req.currentUser || null });
  }
);

export { router as currentUserRouter };
