import express from "express";
import "express-async-errors";
import cookieSession from "cookie-session";

import { json } from "body-parser";
import { errorHandler } from "./middlewares/error-handler";
import { NotFoundError } from "./errors/not-found-error";
import { signupRouter } from "./routes/signup";
import { signinRouter } from "./routes/signin";
import { currentUserRouter } from "./routes/currentUser";
import { signoutRouter } from "./routes/signout";
import { sendFriendRequestRouter } from "./routes/send-friend-request";
import { respondToFriendRequestRouter } from "./routes/respond-to-friend-request";
import { removeFriendRouter } from "./routes/remove-friend";

const app = express();

app.use(json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    signed: false,
    secure: false,
  })
);

app.use(signupRouter);
app.use(signinRouter);
app.use(currentUserRouter);
app.use(signoutRouter);
app.use(sendFriendRequestRouter);
app.use(respondToFriendRequestRouter);
app.use(removeFriendRouter);

app.all("*", async (req, res, next) => {
  throw new NotFoundError();
});
// @ts-ignore
app.use(errorHandler);

export { app };
