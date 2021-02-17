const express = require("express");
//const q2m = require("query-to-mongo");
const { authenticate, refreshToken } = require("../auth/tools");
const { authorize } = require("../auth/middleware");

const UserModel = require("./schema");

const usersRouter = express.Router();

usersRouter.get("/", authorize, async (req, res, next) => {
  try {
    console.log(req.user);
    const users = await UserModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", authorize, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    const { _id } = await newUser.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    updates.forEach(update => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne(res.send("Deleted"));
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    console.log("process.env.JWT_SECRET", process.env.JWT_SECRET)
    //grab credentials
    const { email, password } = req.body;
    //checkdata base with credentials
    const user = await UserModel.findByCredentials(email, password);
    // credentials ok? generate token (using the async function created) 
    const {accessToken, refreshToken} = await authenticate(user);
    //send back the token
    res.send({accessToken, refreshToken});
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      t => t.token !== req.body.refreshToken
    );
    await req.user.save();
    res.send();
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/refreshToken", async (req, res, next) => {
  
  //grab the refresh token
  const oldRefreshToken = req.body.refreshToken;
  if (!oldRefreshToken) {
    const err = new Error("Refresh token missing");
    err.httpStatusCode = 400;
    next(err);
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken);
      res.send(newTokens);
    } catch (error) {
      console.log(error);
      const err = new Error(error);
      err.httpStatusCode = 403;
      next(err);
    }
  }
});

module.exports = usersRouter;
