import { body } from "express-validator";
import express, { Request, Response, NextFunction } from "express";
import { sendFriendRequest } from "../controllers/send-friend-request";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();

router.post("/api/friends/request", requireAuth, sendFriendRequest);

export { router as sendFriendRequestRouter };
