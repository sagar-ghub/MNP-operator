const express = require("express");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");

const { body, validationResult, query } = require("express-validator");
const MnpSchema = require("../models/MnpSchema");
const data = require("../../scripts/Andhra Pradesh.json");
const PlanSchema = require("../models/PlanSchema");
const states = require("../util/indian_states");
const router = express.Router();
// console.log(states);
router.get("/createplan", async (req, res) => {
  try {
    for (let i = 1; i < states.length; i++) {
      let state_data = require(`../../scripts/${states[i]}.json`);
      let arr = [],
        circle_id = i,
        operator_id = 3;

      if (state_data.length > 0) {
        //looping in a matrix
        for (let i = 0; i < state_data.length; i++) {
          for (let j = 0; j < state_data[i].length; j++) {
            // console.log(data[i][j]);

            let obj = {
              amount: state_data[i][j].price,
              validity: state_data[i][j].validity,
              description: state_data[i][j].description,
              is_valid: 1,
            };
            arr.push(obj);
          }
        }
        //update it to mongodb planschema
        let plan = await PlanSchema.findOneAndUpdate(
          { operator_id: operator_id, "circles.circle_id": circle_id },
          {
            $push: {
              "circles.$.plan": [...arr],
            },
          },
          { new: true }
        );
        // if (!plan) {
        //   return res.status(200).json({ error: 1, msg: "Error" });
        // }
      }
    }
    // console.log(plan);
    return res.status(200).json({ error: 0, msg: "success" });

    // return res.status(200).json({ error: 0, msg: "success", plan: arr });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "Something broke!" });
  }
});

module.exports = router;
