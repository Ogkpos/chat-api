import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validate-request";
import prisma from "../services/prisma-client";
import { respondToFriendRequest } from "../controllers/respond-to-friend-request";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();

router.post("/api/friends/respond", requireAuth, respondToFriendRequest);

export { router as respondToFriendRequestRouter };
