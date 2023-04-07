const express = require("express");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");

const { body, validationResult, query } = require("express-validator");
const MnpSchema = require("../models/MnpSchema");

const router = express.Router();

//get csv file from client

router.post("/mnp", async (req, res) => {
  try {
    let results = [];
    let count = 0,
      count1 = 0;
    if (!req.files) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const file = req.files.file;
    console.log(file);
    fs.createReadStream(file.tempFilePath)
      .pipe(csv())
      .on("data", (data) => {
        count++;
        count1++;
        data.mobile_code = data.mobile.slice(0, 5);
        results.push(data);
        if (count % 10 === 0) {
          MnpSchema.insertMany(results).then(function (error, docs) {
            if (error) {
              //   console.log(error);
            } else {
              console.log("Multiple documents inserted to Collection", count1);
            }
          });
          results = [];
        }
      })
      .on("end", () => {
        if (results.length > 0) {
          MnpSchema.insertMany(results).then(function (error, docs) {
            if (error) {
              //   console.log(error);
            } else {
              console.log("Multiple documents inserted to Collection");
            }
          });
        }
      });
    return res.status(200).json({ error: 0, msg: "success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});

module.exports = router;
