import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { removeFriend } from "../controllers/remove-friend";

const router = express.Router();

router.post("/api/friends/remove", requireAuth, removeFriend);

export { router as removeFriendRouter };
