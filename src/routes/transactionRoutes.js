const express = require("express");
const jwt = require("jsonwebtoken");

const { body, validationResult, query } = require("express-validator");
const UserSchema = require("../models/UserSchema");

const router = express.Router();

//add money to wallet
router.post(
  "/addmoney",
  [
    body("amount").isNumeric().withMessage("amount is required"),
    body("description").isString().withMessage("description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const { amount, description } = req.body;
    try {
      let walletHistory = {
        amount,
        description,
        type: "credit",
      };

      let id = "642fbca7006af1419504ff5b";
      const user = await UserSchema.findOneAndUpdate(
        { _id: id },
        { $inc: { wallet: amount }, $push: { walletHistory } },
        { new: true }
      );
      return res
        .status(200)
        .json({ error: 0, msg: "success", data: "money added successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "Something broke!" });
    }
  }
);

//deduct money from wallet
router.post(
  "/deductmoney",
  [
    body("amount").isNumeric().withMessage("amount is required"),
    body("description").isString().withMessage("description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let id = "642fbca7006af1419504ff5b";
    const { amount, description } = req.body;
    try {
      let walletHistory = {
        amount,
        description,
        type: "debit",
      };
      const user = await UserSchema.findOneAndUpdate(
        { _id: id },
        { $inc: { wallet: -amount }, $push: { walletHistory } },
        { new: true }
      );
      return res
        .status(200)
        .json({
          error: 0,
          msg: "success",
          data: "money deducted successfully",
        });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "Something broke!" });
    }
  }
);

router.get("/getwallet", async (req, res) => {
  try {
    let id = "642fbca7006af1419504ff5b";
    const user = await UserSchema.findOne({ _id: id });
    return res.status(200).json({ error: 0, msg: "success", user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});
router.get("/getwalletHistory", async (req, res) => {
  try {
    let id = "642fbca7006af1419504ff5b";
    const user = await UserSchema.findOne(
      { _id: id },
      { walletHistory: 1, _id: 0 }
    );
    return res
      .status(200)
      .json({ error: 0, msg: "success", data: user.walletHistory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});

module.exports = router;
