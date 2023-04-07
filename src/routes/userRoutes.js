const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult, query } = require("express-validator");
const {
  apiSecrect,
  tables,
  userRole,
  webTokenExpires,
  otpTokenExpires,
  userStatus,
  webSecrect,
} = require("../../config");
const UserSchema = require("../models/UserSchema");
const requireAuth = require("../middlewares/requireAuth");

// const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = new UserSchema({ name, email, password });
    await user.save();

    return res.status(200).json({ error: 0, msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});

//login and generate token
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res.status(200).json({ error: 1, msg: "Invalid username" });
    }
    // await user.comparePassword(password);
    user.comparePassword(password, function (err, isMatch) {
      console.log(err, isMatch);
      if (err)
        return res.status(200).json({ error: 1, msg: "Invalid credentials" });
      if (!isMatch)
        return res.status(200).json({ error: 1, msg: "Invalid credentials" });
      // console.log(user._id, user.name);
      let token = jwt.sign({ name: user.name, id: user._id }, webSecrect, {
        expiresIn: webTokenExpires,
        algorithm: "HS256",
      });
      return res.status(200).json({ error: 0, msg: "success", token });
    });

    // return res.status(200).json({ error: 1, msg: "Invalid credentials" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});

router.post("/createapitoken", requireAuth(), async (req, res) => {
  try {
    const user = req.user;
    let token = jwt.sign({ name: user.name, id: user.id }, apiSecrect, {
      algorithm: "HS256",
    });

    //add token to user dcoument
    await UserSchema.updateOne(
      { _id: user.id },
      { $push: { apiToken: token } }
    );

    return res.status(200).json({ error: 0, msg: "success", apiToken: token });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});
router.get("/getapitoken", requireAuth(), async (req, res) => {
  try {
    const user = req.user;
    const data = await UserSchema.findOne({ _id: user.id });
    if (!data) return res.status(200).json({ error: 1, msg: "User not found" });
    return res
      .status(200)
      .json({ error: 0, msg: "success", apiToken: data.apiToken });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});

module.exports = router;
