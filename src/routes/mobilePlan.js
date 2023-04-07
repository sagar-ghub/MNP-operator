const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult, query } = require("express-validator");
const MnpSchema = require("../models/MnpSchema");
const PlanSchema = require("../models/PlanSchema");

const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.post(
  "/createMnp",
  body("mobile").not().isEmpty().trim().escape().isMobilePhone(),
  body("operator_id").not().isEmpty().trim().escape(),
  body("circle_code").not().isEmpty().trim().escape(),
  body("circle_id").not().isEmpty().trim().escape(),
  body("is_port").not().isEmpty().trim().escape(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile, operator_id, circle_code, circle_id, is_port } = req.body;
    try {
      const mobiledetails = await MnpSchema.find({ mobile: mobile });
      if (mobiledetails.length > 0) {
        console.log(mobiledetails);
        return res.status(200).json({ error: 0, msg: "already exists" });
      }

      const mnp = new MnpSchema({
        mobile,
        operator_id,
        circle_code,
        mobile_code: mobile.slice(0, 5),
        circle_id,
        is_port,
      });
      await mnp.save();
      return res.status(200).json({ error: 0, msg: "success" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "error" });
    }
  }
);
//get Mnp by mobile
router.get("/getMnpByMobile", requireAuth("api"), async (req, res) => {
  const { mobile } = req.query;
  try {
    const results = MnpSchema.find({ mobile: mobile });
    return res.status(200).json({ error: 0, msg: "success", results });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "error" });
  }
});

router.post(
  "/createOpeartor",
  body("operator_id").not().isEmpty().trim().escape(),
  body("operator_name").not().isEmpty().trim().escape(),
  async (req, res) => {
    const { operator_id, operator_name } = req.body;
    try {
      //if operator already exists return error
      const result = await PlanSchema.findOne({ operator_id: operator_id });
      if (result) {
        return res
          .status(200)
          .json({ error: 1, msg: "operator already exists" });
      }
      const circles = [];
      for (let i = 1; i < 31; i++) {
        const circle = {
          circle_id: i,
          plans: [],
        };
        circles.push(circle);
      }
      const plan = new PlanSchema({
        operator_id,
        operator_name,
        circles: [...circles],
      });
      await plan.save();
      return res.status(200).json({ error: 0, msg: "success" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "error" });
    }
  }
);

//create circle by operator_id
router.post(
  "/createCircle",
  body("operator_id").not().isEmpty().trim().escape(),
  body("circle_id").not().isEmpty().trim().escape(),
  body("circle_name").not().isEmpty().trim().escape(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { operator_id, circle_id, circle_name } = req.body;
    try {
      const operator = await PlanSchema.findOne({ operator_id: operator_id });
      if (!operator) {
        return res
          .status(200)
          .json({ error: 1, msg: "operator does not exists" });
      }

      //if circle already exists return error
      const result = await PlanSchema.findOne({
        operator_id: operator_id,
        "circles.circle_id": circle_id,
      });
      if (result) {
        return res.status(200).json({ error: 1, msg: "circle already exists" });
      }

      //push circle to operator
      const circle = {
        circle_id,
        circle_name,
        plans: [],
      };
      await PlanSchema.findOneAndUpdate(
        { operator_id: operator_id },
        { $push: { circles: circle } }
      );
      return res.status(200).json({ error: 0, msg: "success" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "error" });
    }
  }
);

router.post(
  "/createPlanforCirlce",
  body("operator_id").not().isEmpty().trim().escape(),
  body("circle_id").not().isEmpty().trim().escape(),
  body("amount").not().isEmpty().trim().escape(),
  body("validity").not().isEmpty().trim().escape(),
  body("description").not().isEmpty().trim().escape(),

  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { operator_id, circle_id, amount, validity, description } = req.body;

    try {
      const operator = await PlanSchema.findOne({
        operator_id: operator_id,
        "circles.circle_id": circle_id,
      });
      if (!operator) {
        return res
          .status(200)
          .json({ error: 1, msg: "operator/circle does not exists" });
      }
      const plans = await PlanSchema.findOne({
        operator_id: operator_id,
        "circles.circle_id": circle_id,
        "circles.plan.amount": amount,
      });
      if (plans) {
        return res.status(200).json({ error: 1, msg: "plan already exists" });
      }
      const plan = {
        amount,
        validity,
        description,
      };
      const planF = await PlanSchema.findOneAndUpdate(
        { operator_id: operator_id, "circles.circle_id": circle_id },
        { $push: { "circles.$.plan": plan } }
      );
      return res.status(200).json({ error: 0, msg: "success", plan: planF });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "error" });
    }
  }
);

router.get(
  "/getMnpDetails",
  requireAuth("api"),
  query("mobile").not().isEmpty().trim().escape().isMobilePhone(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile } = req.query;
    try {
      const result = await MnpSchema.findOne({ mobile: mobile });
      if (!result) {
        return res.status(200).json({ error: 1, msg: "mobile not found" });
      }
      return res.status(200).json({ error: 0, msg: "success", data: result });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "error" });
    }
  }
);

router.get("/getPlans", async (req, res) => {
  // const { operator_id, circle_id } = req.query;
  const operator_id = req.query.operator_id || "";
  const circle_id = req.query.circle_id || "";
  const amount = req.query.amount || "";

  let searchObj = {
    operator_id: operator_id,
    "circles.circle_id": circle_id,
    "circles.plan.amount": amount,
  };
  console.log(searchObj);
  if (amount == "") delete searchObj["circles.plan.amount"];
  try {
    const operator = await PlanSchema.findOne(searchObj, "circles.$");
    if (!operator) {
      return res
        .status(200)
        .json({ error: 1, msg: "operator/circle does not exists" });
    }
    return res.status(200).json({ error: 0, msg: "success", data: operator });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 1, msg: "error" });
  }
});
router.get(
  "/checkAmount",
  requireAuth("api"),
  query("operator_id").not().isEmpty().trim().escape().isNumeric(),
  query("circle_id").not().isEmpty().trim().escape().isNumeric(),
  async (req, res) => {
    // const { operator_id, circle_id } = req.query;
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const operator_id = req.query.operator_id || "";
    const circle_id = req.query.circle_id || "";
    const amount = req.query.amount || "";

    // console.log(searchObj);
    // if (amount == "") delete searchObj["circles.plan.amount"];
    try {
      const operator = await PlanSchema.findOne(
        {
          $and: [
            {
              operator_id: operator_id,
            },
            {
              circles: { $elemMatch: { circle_id: circle_id } },
            },
            // {
            //   "circles.plan.": { $elemMatch: { amount: amount } },
            // },
            // {
            //   "circles.plan": { $elemMatch: { amount: amount, is_valid: 1 } },
            // },
          ],
        },
        "circles.$"
      );
      // console.log(operator);
      if (!operator) {
        return res.status(200).json({
          error: 1,
          msg: "operator/circle does not exists",
          is_valid: false,
        });
      }

      // const plan = operator.circles[0].plan.find((p) => p.amount == amount);
      // if (!plan.is_valid) {
      //   return res.status(200).json({
      //     error: 1,
      //     msg: "plan is not valid",
      //     is_valid: false,
      //   });
      // }
      // console.log(operator.circles[0]);
      const plan = operator.circles[0].plan;
      let final_plan = {};
      if (amount == "") {
        return res.status(200).json({
          error: 0,
          msg: "plan is valid",
          data: plan,
          is_valid: true,
        });
      }

      for (const key in plan) {
        let arr = [...plan[key]];
        // console.log("asa", arr);
        final_plan = arr.find((p) => {
          // console.log(p.amount, amount);
          return p.amount == amount;
        });
        // console.log(final_plan);
        if (final_plan) break;
      }
      if (!final_plan) {
        return res.status(200).json({
          error: 1,
          msg: "plan is not valid",
          is_valid: false,
        });
      }

      return res.status(200).json({
        error: 0,
        msg: "plan is valid",
        data: final_plan,
        is_valid: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 1, msg: "error" });
    }
  }
);

module.exports = router;
