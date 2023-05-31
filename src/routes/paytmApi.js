const express = require("express");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");

const { body, validationResult, query } = require("express-validator");
const MnpSchema = require("../models/MnpSchema");
// const data = require("../../scripts/Andhra Pradesh.json");
const Plan = require("../models/PlanSchema");
const states = require("../util/indian_states");
const router = express.Router();
const axios = require("axios");
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

/*
const axios = require('axios');
const mongoose = require('mongoose');

// Define the operator array
const operatorArr = ['', 'Jio', 'Airtel', 'Vodafone%20Idea', 'BSNL'];

// Connect to the MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/rkit', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define the schema for the plans collection
const planSchema = new mongoose.Schema({
  amount: Number,
  validity: String,
  description: String,
  talktime: String,
  sms: String,
  disclaimer: String,
  is_valid: Number
});

// Define the schema for the circles collection
const circleSchema = new mongoose.Schema({
  circle_id: Number,
  plan: {
    type: Map,
    of: [planSchema]
  }
});

// Define the schema for the operator collection
const operatorSchema = new mongoose.Schema({
  operator_id: Number,
  operator_name: String,
  circles: [circleSchema]
});

// Define the models for the collections
const Plan = mongoose.model('Plan', planSchema);
const Circle = mongoose.model('Circle', circleSchema);
const Operator = mongoose.model('Operator', operatorSchema);

// Loop over each operator
for (let operatorId = 1; operatorId <= 4; operatorId++) {
  let operatorName = operatorArr[operatorId];

  // Loop over each state
  for (let stateName of ["Andhra Pradesh", "Assam", "Bihar Jharkhand", "Chennai", "Gujarat", "Haryana", "Himachal Pradesh", "Karnataka", "Kerala", "Kolkata", "Madhya Pradesh Chattisgarh", "Maharashtra", "North East", "Orissa", "Punjab", "Rajasthan", "Tamil Nadu", "UP East", "UP West", "West Bengal"]) {

    // Make the HTTP request using Axios
    let url = `https://digitalcatalog.paytm.com/dcat/v1/browseplans/mobile/7166?channel=web&version=2&child_site_id=1&site_id=1&locale=en-in&operator=${operatorName}&pageCount=1&itemsPerPage=20&sort_price=asce&pagination=1&circle=${stateName.replace(' ', '%20')}`;
    let response = await axios.get(url);
    let data = response.data;

    // Process the response data and store it in the database
    let plans = data.groupings;
    let circleId = operatorArr.indexOf(stateName) + 1;
    let circle = new Circle({
      circle_id: circleId,
      plan: new Map()
    });

    for (let plan of plans) {
      let planName = plan.name;
      let productList = plan.productList;
      let planGrouping = [];

      for (let product of productList) {
        let planObj = new Plan({
          amount: product.price,
          validity: product.validity,
          description: product.description,
          talktime: product.talktime,
          sms: product.sms,
          disclaimer: product.disclaimer,
          is_valid: 1
        });
        planGrouping.push(planObj);
      }

      if (planName === 'Jio Cricket') {
        circle.plan.set('Cricket', planGrouping);
      } else {
        circle.plan.set(planName, planGrouping);
      }
    }

    let operator = await Operator.findOne({ operator_id: operatorId });
    if (!operator) {
      operator = new
      */
const operatorArr = ["", "Jio", "Airtel", "Vodafone%20Idea", "BSNL"];
let k = 0;

async function fetchPlans(operatorId, circleName) {
  const url = `https://digitalcatalog.paytm.com/dcat/v1/browseplans/mobile/7166?channel=web&version=2&child_site_id=1&site_id=1&locale=en-in&operator=${
    operatorArr[operatorId]
  }&pageCount=1&itemsPerPage=20&sort_price=asce&pagination=1&circle=${circleName.replace(
    " ",
    "%20"
  )}`;
  const response = await axios.get(url);
  const data = response.data;
  const plans = data.groupings;
  const arr = {};
  const circlePlans = [];
  for (const plan of plans) {
    const planGrouping = [];
    for (const product of plan.productList) {
      planGrouping.push({
        amount: product.price,
        validity: product.validity,
        description: product.description,
        talktime: product.talktime,
        sms: product.sms,
        disclaimer: product.disclaimer,
        is_valid: 1,
      });
    }
    if (plan.name === "Jio Cricket") {
      arr["Cricket"] = planGrouping;
    } else {
      arr[plan.name] = planGrouping;
    }
  }
  k++;
  circlePlans.push({ circle_id: k, plan: arr });
  return circlePlans;
}

router.get("/minePlans", async (req, res) => {
  for (let operatorId = 1; operatorId <= 4; operatorId++) {
    k = 0;
    // Loop over all the states
    for (const stateName of [
      "Andhra Pradesh", //1
      "Assam", //2
      "Bihar Jharkhand", //3
      "Chennai", //4
      "Gujarat", //5
      "Haryana", //6
      "Himachal Pradesh", //7
      "Karnataka", //8
      "Kerala", //9
      "Kolkata", //10
      "Madhya Pradesh Chattisgarh", //11
      "Maharashtra", //12
      "North East", //13
      "Orissa", //14
      "Punjab", //15
      "Rajasthan", //16
      "Tamil Nadu", //17
      "UP East", //18
      "UP West", //19
      "West Bengal", //19
    ]) {
      const circlePlans = await fetchPlans(operatorId, stateName);
      // console.log(circlePlans);
      // return res.status(200).json(circlePlans);
      const operatorName = operatorArr[operatorId];

      const updateData = await Plan.findOneAndUpdate(
        {
          operator_id: operatorId,
          "circles.circle_id": circlePlans[0].circle_id,
        },
        { $set: { "circles.$.plan": circlePlans[0].plan } },
        { new: true }
      );

      // const existingDoc = await Plan.findOne({ operator_id: operatorId });
      // if (existingDoc) {
      //   // Update the existing document
      //   const existingCircleIndex = existingDoc.circles.findIndex(
      //     (c) => c.circle_name === stateName
      //   );
      //   if (existingCircleIndex !== -1) {
      //     existingDoc.circles[existingCircleIndex].plan = circlePlans[0].plan;
      //   } else {
      //     existingDoc.circles.push(circlePlans[0]);
      //   }
      //   await existingDoc.save();
      // } else {
      //   // Create a new document
      //   const doc = new Plan({
      //     operator_id: operatorId,
      //     operator_name: operatorName,
      //     circles: circlePlans,
      //   });
      //   await doc.save();
      // }
      console.log(`${stateName} done for ${operatorName}`);
    }
  }
  return res.status(200).json({ error: "0", message: "Done" });
});

module.exports = router;
