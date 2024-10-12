require("dotenv").config()
const express = require("express");
const cors = require("cors")
const mongoose = require("mongoose");

const registerUserRouter = require("./router/users/register");
const { specs, swaggerUi } = require("./../swagger");
const loginRouter = require("./router/users/login");
const friendsRouter = require("./router/users/friends");
const jwtHandler = require("./middleware/jwtHandler");
const getUserRouter = require("./router/users/me");
const groupHandler = require("./router/groups/index");
const messageHandler = require("./router/messages/index");
const chatHandler = require("./router/chats/index");

const PORT = process.env.API_SERVICE_PORT;

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));
app.use("/api/users/register", registerUserRouter);
app.use("/api/users/login", loginRouter);
app.use("/api/users/me", jwtHandler, getUserRouter);
app.use("/api/users/friends", jwtHandler, friendsRouter);

app.use("/api/groups", jwtHandler, groupHandler);
app.use("/api/messages", jwtHandler, messageHandler);
app.use("/api/chats", jwtHandler, chatHandler);

app.listen(PORT, () => console.log(`[API_SERVICE] Listening on port: ${PORT}`));

mongoose.connect(process.env.DB_URI)
  .then(() => console.log("[DATABASE] Connected"))
  .catch(() => console.log("[DATABASE] Connection failed!"));

