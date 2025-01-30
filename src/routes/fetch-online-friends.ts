import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validate-request";
import { fetchOnlineFriends } from "../controllers/fetch-online-friends";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();

router.get(
  "/api/users/online-friends/:userId",
  requireAuth,
  fetchOnlineFriends
);

export { router as fetchOnlineFriendsRouter };
