require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { NODE_ENV } = require("./config");
const errorHandler = require("./error-handler");
const articlesRouter = require("./articles/articles-router");
const usersRouter = require("./users/users-router");
const commentsRouter = require("./comments/comments-router");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use("/api/articles", articlesRouter);
app.use("/api/users", usersRouter);
app.use("/api/comments", commentsRouter);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.get("/xss", (req, res) => {
  res.cookie("secretToken", "1234567890");
  res.sendFile(__dirname + "/xss-example.html");
});

app.use(errorHandler);

module.exports = app;
