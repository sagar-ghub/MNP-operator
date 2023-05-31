const express = require("express");
const axios = require("axios");
const BoardSchema = require("../models/BoardSchema");
const router = express.Router();

router.post("/", async (req, res) => {
  const { mobile, operator } = req.body;

  const url = `https://www.freecharge.in/api/fulfilment/nosession/bill/fetch`;
  let operatorId = 0;
  switch (operator) {
    case "airtel":
      operatorId = 473;
      break;
    case "jio":
      operatorId = 475;
      break;
    case "vi":
      operatorId = 476;
      break;
    case "bsnl":
      operatorId = 474;
      break;
    default:
      operatorId = 0;
      break;
  }

  const payload = {
    authenticators: [
      { parameterName: "Mobile Number", parameterValue: mobile },
    ],
    operatorId: operatorId,
    category: "Mobile Postpaid",
    circleId: 0,
  };
  try {
    const response = await axios({
      method: "post",
      url: "https://www.freecharge.in/api/fulfilment/nosession/bill/fetch",
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    console.log(response.data);
    if (response.data.error != null)
      return res.status(400).json({
        error: 1,
        status: "400",
        msg: response.data.error.errorMessage,
      });
    let obj = response.data.data;

    let result = {
      mobile: "",
      customer_name: "",
      amount: "",
      bill_due_date: "",
      bill_date: "",
      bill_no: "",
    };
    obj.userDetails.forEach((detail) => {
      if (detail.label === "Mobile Number") result.mobile = detail.value;
      if (detail.label === "Customer Name") result.customer_name = detail.value;
    });

    obj.billDetails.forEach((detail) => {
      if (detail.label === "Bill Amount") result.amount = detail.value;
      if (detail.label === "Bill Due Date") result.bill_due_date = detail.value;
    });

    obj.additionalDetails.forEach((detail) => {
      if (detail.label === "Bill Date") result.bill_date = detail.value;
      if (detail.label === "Bill Number") result.bill_no = detail.value;
    });

    return res.status(200).json({
      error: 0,
      status: "200",
      msg: "Bill fetched successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 1, status: "500", msg: "Something broke!" });
  }
});

router.post("/dth", async (req, res) => {
  const { subscriberId, operator } = req.body;

  const url = `https://www.freecharge.in/api/fulfilment/nosession/bill/fetch`;
  let operatorId = 0;
  let parameterName = "";
  switch (operator) {
    case "airtelDth":
      operatorId = 482;
      parameterName = "Customer Id";
      break;
    case "d2hDth":
      operatorId = 486;
      parameterName = "Customer ID / Registered Telephone No";
      break;
    case "dishDth":
      operatorId = 483;
      parameterName = "Registered Mobile Number / Viewing Card Number";
      break;
    case "sunDth":
      operatorId = 484;
      parameterName = "Subscriber Number";
      break;
    case "tataDth":
      operatorId = 485;
      parameterName = "Subscriber Number";
      break;
    default:
      operatorId = 0;
      break;
  }

  const payload = {
    authenticators: [
      { parameterName: parameterName, parameterValue: subscriberId },
    ],
    operatorId: operatorId,
    category: "DTH Recharge",
    circleId: 0,
  };

  // console.log(payload);
  try {
    const response = await axios({
      method: "post",
      url: "https://www.freecharge.in/api/fulfilment/nosession/bill/fetch",
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    // console.log(response.data);
    if (response.data.error != null)
      return res.status(400).json({
        error: 1,
        status: "400",
        msg: response.data.error.errorMessage,
      });
    let obj = response.data.data;

    let result = {
      consumerId: "",
      customer_name: "",
      amount: "",
      bill_due_date: "",
      bill_date: "",
      bill_no: "",
    };
    console.log(obj);
    obj.userDetails.forEach((detail) => {
      if (detail.label === "Subscriber Number")
        result.consumerId = detail.value;
      if (detail.label === "Customer Name") result.customer_name = detail.value;
    });

    obj.billDetails.forEach((detail) => {
      if (detail.label === "Bill Amount") result.amount = detail.value;
      if (detail.label === "Bill Due Date") result.bill_due_date = detail.value;
    });

    obj.additionalDetails.forEach((detail) => {
      if (detail.label === "Bill Date") result.bill_date = detail.value;
      if (detail.label === "Bill Number") result.bill_no = detail.value;
    });

    return res.status(200).json({
      error: 0,
      status: "200",
      msg: "Bill fetched successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 1, status: "500", msg: "Something broke!" });
  }
});

// router.post("/electricity", async (req, res) => {
//   const { subscriberId, operator, parameterName } = req.body;

//   const url = `https://www.freecharge.in/api/fulfilment/nosession/bill/fetch`;
//   let operatorId = operator;
//   // switch (operator) {
//   //   case "airtel":
//   //     operatorId = 473;
//   //     break;
//   //   case "jio":
//   //     operatorId = 475;
//   //     break;
//   //   case "vi":
//   //     operatorId = 476;
//   //     break;
//   //   case "bsnl":
//   //     operatorId = 474;
//   //     break;
//   //   default:
//   //     operatorId = 0;
//   //     break;
//   // }

//   const payload = {
//     authenticators: [
//       { parameterName: parameterName, parameterValue: subscriberId },
//     ],
//     operatorId: operatorId,
//     category: "Electricity BillPayment",
//     circleId: 0,
//   };
//   try {
//     const response = await axios({
//       method: "post",
//       url: "https://www.freecharge.in/api/fulfilment/nosession/bill/fetch",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       data: payload,
//     });
//     console.log(response.data);
//     if (response.data.error != null)
//       return res.status(400).json({
//         error: 1,
//         status: "400",
//         msg: response.data.error.errorMessage,
//       });
//     let obj = response.data.data;

//     let result = {
//       consumerId: "",
//       customer_name: "",
//       amount: "",
//       bill_due_date: "",
//       bill_date: "",
//       bill_no: "",
//     };
//     obj.userDetails.forEach((detail) => {
//       if (detail.label === "Consumer Id") result.consumerId = detail.value;
//       if (detail.label === "Customer Name") result.customer_name = detail.value;
//     });

//     obj.billDetails.forEach((detail) => {
//       if (detail.label === "Bill Amount") result.amount = detail.value;
//       if (detail.label === "Bill Due Date") result.bill_due_date = detail.value;
//     });

//     obj.additionalDetails.forEach((detail) => {
//       if (detail.label === "Bill Date") result.bill_date = detail.value;
//       if (detail.label === "Bill Number") result.bill_no = detail.value;
//     });

//     return res.status(200).json({
//       error: 0,
//       status: "200",
//       msg: "Bill fetched successfully",
//       data: result,
//     });
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(500)
//       .json({ error: 1, status: "500", msg: "Something broke!" });
//   }
// });

router.post("/electricity", async (req, res) => {
  const { stateId, operatorId, consumerId } = req.body;

  if (!stateId && !operatorId) {
    return res.status(400).json({
      error: 1,
      status: "400",
      msg: "State Id or Board Id is required",
    });
  }
  // if(!boardId)
  let query = {},
    boards = {};
  if (operatorId) boards = await BoardSchema.find({ boardId: operatorId });
  else boards = await BoardSchema.find({ stateId });

  // console.log(boards);
  if (boards.length === 0) {
    return res.status(400).json({
      error: 1,
      status: "400",
      msg: "No boards found",
    });
  }
  if (!consumerId)
    return res.status(200).json({
      error: 0,
      status: "200",
      msg: "Boards fetched successfully",
      data: boards,
    });
  else if (consumerId && operatorId) {
    const url = `https://www.freecharge.in/api/fulfilment/nosession/bill/fetch`;
    const payload = {
      authenticators: [
        { parameterName: boards[0].parameterName, parameterValue: consumerId },
      ],
      operatorId: boards[0].operatorId,
      category: "Electricity BillPayment",
      circleId: 0,
    };
    // console.log(payload, boards, boards.parameterName);
    try {
      const response = await axios({
        method: "post",
        url: "https://www.freecharge.in/api/fulfilment/nosession/bill/fetch",
        headers: {
          "Content-Type": "application/json",
        },
        data: payload,
      });
      console.log(response.data);
      if (response.data.error != null)
        return res.status(400).json({
          error: 1,
          status: "400",
          msg: response.data.error.errorMessage,
        });
      let obj = response.data.data;

      let result = {
        consumerId: "",
        customer_name: "",
        amount: "",
        bill_due_date: "",
        bill_date: "",
        bill_no: "",
      };
      obj.userDetails.forEach((detail) => {
        if (detail.label === boards[0].parameterName)
          result.consumerId = detail.value;
        if (detail.label === "Customer Name")
          result.customer_name = detail.value;
      });

      obj.billDetails.forEach((detail) => {
        if (detail.label === "Bill Amount") result.amount = detail.value;
        if (detail.label === "Bill Due Date")
          result.bill_due_date = detail.value;
      });

      obj.additionalDetails.forEach((detail) => {
        if (detail.label === "Bill Date") result.bill_date = detail.value;
        if (detail.label === "Bill Number") result.bill_no = detail.value;
      });

      if (result.consumerId === "") result.consumerId = consumerId;

      return res.status(200).json({
        error: 0,
        status: "200",
        msg: "Bill fetched successfully",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: 1, status: "500", msg: "Something broke!" });
    }
  } else {
    return res.status(200).json({
      error: 0,
      status: "200",
      msg: "Boards fetched successfully",
      data: boards,
    });
  }
});

module.exports = router;
