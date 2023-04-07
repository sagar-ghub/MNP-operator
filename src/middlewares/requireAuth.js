const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../../config");

module.exports =
  (api = "") =>
  (req, res, next) => {
    if (
      !req.headers.authorization ||
      req.headers.authorization.split(" ")[0] !== "Bearer"
    ) {
      return res.status(401).json({ error: 1, msg: "Unauthorized access" });
    }

    const token = req.headers.authorization.split(" ")[1];
    let secret = config.webSecrect;
    if (api == "api") {
      secret = config.apiSecrect;
    }
    jwt.verify(token, secret, async (err, payload) => {
      if (err) {
        return res.status(401).json({ error: 1, msg: "Unauthorized access" });
      }

      const { id } = payload;
      console.log(payload);
      try {
        // let results = await knexdb
        //   .select("*")
        //   .from(tables.user)
        //   .where("user_id", id)
        //   .where("is_delete", 0)
        //   .where("is_user_active", 1);
        // if (results.length === 0) {
        //   return res.status(401).json({ error: 1, msg: "User not found" });
        // }
        req.user = payload;
        next();
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 1, msg: "Something went wrong" });
      }
    });
  };
