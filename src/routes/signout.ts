import express, { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middlewares/validate-request";
import prisma from "../services/prisma-client";
import { signin } from "../controllers/signin";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();

router.post("/api/users/signout", async (req: Request, res: Response) => {
  req.session = null;
  res.send({});
});

export { router as signoutRouter };
