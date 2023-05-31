const express = require("express");
const axios = require("axios");
const router = express.Router();
var AES = require("crypto-js/aes");
var SHA256 = require("crypto-js/sha256");
var CryptoJS = require("crypto-js");
const { body, validationResult, query } = require("express-validator");

const findBillerId = (operator) => {
  const billerId = {
    1: "ART00MR000MR01",
    2: "JI0000000NAT01",
  };
  return billerId[operator];
};

const calculateAES256 = (payload) => {
  const secret = process.env.SECRET;

  const secretKey = CryptoJS.enc.Utf8.parse(secret);
  const iv = CryptoJS.enc.Utf8.parse(secret);

  const encryptedText = CryptoJS.AES.encrypt(payload, secretKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    keySize: 128,
  });
  return encryptedText.toString();
};

const calculateHash = (data) => {
  const sortedNumber = data.mobile.split("").sort().join("");

  const payload = `${data.orderId}|${process.env.MERCHANT_CODE}|${
    process.env.AGENT_ID
  }|${data.billerId}${data.amount ? `|${data.amount}` : ``}|${sortedNumber}`;

  console.log(payload);

  const secret = process.env.SECRET;
  const salt = process.env.SALT;

  const secretKey = CryptoJS.enc.Utf8.parse(secret);
  const iv = CryptoJS.enc.Utf8.parse(secret);

  const encryptedText = CryptoJS.AES.encrypt(payload, secretKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    keySize: 128,
  });

  //   console.log(encryptedText.toString());
  const hash = CryptoJS.SHA256(encryptedText.toString() + "|" + salt);
  console.log(hash.toString());
  return hash.toString();
};
const calculateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day =
    date.getDate() < 10 ? "0" + date.getDate().toString() : date.getDate();
  const hour =
    date.getHours() < 10 ? "0" + date.getHours().toString() : date.getHours();
  const minutes =
    date.getMinutes() < 10
      ? "0" + date.getMinutes().toString()
      : date.getMinutes();
  const seconds =
    date.getSeconds() < 10
      ? "0" + date.getSeconds().toString()
      : date.getSeconds();

  const orderId = `${year}${month}${day}${hour}${minutes}${seconds}`;
  return orderId;
};
const getRequestKey = (data) => {
  const requestKey = {
    BillValidation: "MerchantValidationRequestDetails",
    BillPayment: "MerchantServiceRequestDetails",
    BillStatus: "BBPSStatusRequestDetails",
    // BillReversal: "MerchantReversalRequestDetails",
  };
  if (data == 1) return requestKey.BillValidation;
  else if (data == 2) return requestKey.BillPayment;
  else if (data == 3) return requestKey.BillStatus;
};

const getConfigPayload = (data) => {
  let payload = {
    RequestType: "",
    [getRequestKey(data.serviceType)]: {
      RequestType: "",
      RequesterIP: process.env.REQUESTER_IP,
      MerchantRefNo: data.orderId, //TODO: generate unique id
      MerchantCode: process.env.MERCHANT_CODE,
      UserName: process.env.USER_NAME,
      UserPass: process.env.USER_PASS,
      StoreCode: process.env.STORE_CODE,
      AgentId: process.env.AGENT_ID,

      BillerId: data.billerId,
      Amount: data.amount ? data.amount + "" : "",
      ChannelDetails: {
        ChannelCode: "INT",
        ChannelParams: [
          {
            name: "GEOCODE",
            value: "25.4484,78.5685",
          },
        ],
      },
      CustomerProfile: [
        {
          name: "MOBILE",
          value: calculateAES256(data.mobile),
        },
        {
          name: "EMAIL",
          value: calculateAES256("ankitchhajer@gmail.com"),
        },
        // {
        //   name: "AADHAAR",
        //   value: "4XX11XXX5246",
        // },
        // {
        //   name: "PAN",
        //   value: "BXXCGXX54K",
        // },
      ],
      SubscriptionDetails: [
        {
          // name: "Customer Number",
          name: "Consumer Number",
          value: data.mobile + "",
        },
      ],
      Hash: "",
    },
  };

  return payload;
};

const url = `https://epayuat.eftapme.com/enserviceAES256/API/EnService`;

const checkStatus = async (orderId) => {
  let payload = getConfigPayload({
    serviceType: 3,
    orderId,
  });

  payload.RequestType = "billpaystatus";
  payload.BBPSStatusRequestDetails.RequestType = "billpaystatus";
  delete payload.BBPSStatusRequestDetails.MerchantRefNo;
  delete payload.BBPSStatusRequestDetails.BillerId;
  delete payload.BBPSStatusRequestDetails.Amount;
  payload.BBPSStatusRequestDetails.ActualMerchantRefNo = orderId;
  delete payload.BBPSStatusRequestDetails.Hash;
  delete payload.BBPSStatusRequestDetails.SubscriptionDetails;
  delete payload.BBPSStatusRequestDetails.CustomerProfile;
  console.log(payload);
  try {
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    console.log(response.data);
    if (response.data.error != null)
      return {
        error: 1,
        status: "400",
        msg: response.data.error.errorMessage,
      };

    return {
      error: 0,
      status: "200",
      msg: response.data.ResponseMessage,
      data: response.data,
    };
  } catch (error) {
    console.log(error);
    return { error: 1, status: "500", msg: "Something broke!" };
  }
};
const recharge = async (mobile, amount, partnerRequestId, operatorId) => {
  let billerId = findBillerId(operatorId);
  let payload = getConfigPayload({
    mobile,
    amount,
    billerId,
    serviceType: 2,
    orderId: partnerRequestId,
  });
  let hash = calculateHash({
    mobile,
    amount,
    billerId,
    orderId: partnerRequestId,
  });
  // console.log(payload);
  let walletName = "Hari Prasad"; //TODO: change this Hari Prasad|8484943081
  let walletMobile = "8484943081";
  payload.RequestType = "Service";
  payload.MerchantServiceRequestDetails.RequestType = "Service";
  payload.MerchantServiceRequestDetails.PaymentInformation = {
    PaymentMode: "Wallet",
    PaymentParams: [
      {
        name: "WalletName|MobileNo",
        value: calculateAES256(`${walletName}|${walletMobile}`),
      },
    ],
  };
  payload.MerchantServiceRequestDetails.AdditionalInformation = null;

  payload.MerchantServiceRequestDetails.hash = hash;

  // if (req.body.euronetRefNo && req.body.billPaymentToken) {
  //   payload.MerchantServiceRequestDetails.EuronetRefNo = req.body.euronetRefNo;
  //   payload.MerchantServiceRequestDetails.BillPaymentToken =
  //     req.body.billPaymentToken;
  // }

  try {
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    console.log(response.data);
    if (response.data.error != null)
      return {
        error: 1,
        status: "400",
        msg: response.data.error.errorMessage,
      };

    return {
      error: 0,
      status: "200",
      msg: response.data.ResponseMessage,
      data: response.data,
    };
  } catch (error) {
    console.log(error);
    return { error: 1, status: "500", msg: "Something broke!" };
  }
};
const billValidation = async (mobile, amount, orderId, operatorId) => {
  let billerId = findBillerId(operatorId);
  let payload = getConfigPayload({
    mobile,
    amount,
    billerId,
    serviceType: 1,
    orderId,
  });
  let hash = calculateHash({ mobile, amount, billerId, orderId });

  payload.RequestType = "BillValidation";
  payload.MerchantValidationRequestDetails.RequestType = "BillValidation";

  payload.MerchantValidationRequestDetails.SubscriptionDetails[0].name =
    "Consumer Number";
  payload.MerchantValidationRequestDetails.SubscriptionDetails[0].value =
    mobile;
  payload.MerchantValidationRequestDetails.hash = hash;
  console.log(payload);
  try {
    const response = await axios({
      method: "post",
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    });
    // console.log(response.data);
    if (response.data.error != null)
      return {
        error: 1,
        status: "400",
        msg: response.data.error.errorMessage,
      };

    return {
      error: 0,
      status: "200",
      msg: response.data.ResponseMessage,
      data: response.data,
    };
  } catch (error) {
    console.log(error);
    return { error: 1, status: "500", msg: "Something broke!" };
  }
};

router.post("/billvalidation", async (req, res) => {
  const { mobile, amount, serviceType } = req.body;

  // if (!mobile || !amount)
  //   return res
  //     .status(400)
  //     .json({ error: 1, msg: "mobile and amount are required" });

  const billerId = findBillerId(1);
  const merchantRefNo = calculateOrderId();

  let hash = calculateHash({ mobile, amount, billerId, merchantRefNo });
  // return;

  console.log(payload);

  try {
    if (serviceType == 1) {
      payload.RequestType = "BillValidation";
      payload.MerchantValidationRequestDetails.RequestType = "BillValidation";
      // payload.MerchantValidationRequestDetails.BillerId = billerId;
      // payload.MerchantValidationRequestDetails.Amount = amount;

      payload.MerchantValidationRequestDetails.SubscriptionDetails[0].name =
        "Consumer Number";
      payload.MerchantValidationRequestDetails.SubscriptionDetails[0].value =
        mobile;
    } else if (serviceType == 2) {
      // if (req.body.euronetRefNo == null || req.body.billPaymentToken == null)
      //   return res.status(400).json({
      //     error: 1,
      //     msg: "euronetRefNo and billPaymentToken are required",
      //   });
      let walletName = "Hari Prasad"; //TODO: change this Hari Prasad|8484943081
      let walletMobile = "8484943081";
      payload.RequestType = "Service";
      payload.MerchantServiceRequestDetails.RequestType = "Service";
      payload.MerchantServiceRequestDetails.PaymentInformation = {
        PaymentMode: "Wallet",
        PaymentParams: [
          {
            name: "WalletName|MobileNo",
            value: calculateAES256(`${walletName}|${walletMobile}`),
          },
        ],
      };
      payload.MerchantServiceRequestDetails.AdditionalInformation = null;
      // payload.MerchantServiceRequestDetails.EuronetRefNo =
      //   req.body.euronetRefNo;
      // payload.MerchantServiceRequestDetails.BillPaymentToken =
      //   req.body.billPaymentToken;
    } else if (serviceType == 3) {
      if (req.body.actualMerchantRefNo == null)
        return res.status(400).json({
          error: 1,
          msg: "actualMerchantRefNo is required",
        });

      payload.RequestType = "billpaystatus";
      payload.BBPSStatusRequestDetails.RequestType = "billpaystatus";
      payload.BBPSStatusRequestDetails.BillerId = billerId;
      payload.BBPSStatusRequestDetails.ActualMerchantRefNo =
        req.body.actualMerchantRefNo;
      delete payload.BBPSStatusRequestDetails.Hash;
      delete payload.BBPSStatusRequestDetails.SubscriptionDetails;
      delete payload.BBPSStatusRequestDetails.CustomerProfile;
    }

    // return res.status(200).json(payload);

    const response = await axios({
      method: "post",
      url: url,
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

    return res.status(200).json({
      error: 0,
      status: "200",
      msg: response.data.ResponseMessage,
      data: response.data,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: 1, status: "500", msg: "Something broke!" });
  }
});

router.post(
  "/postpaid/validate",
  body("mobile").not().isEmpty().isMobilePhone().trim().escape(),
  body("amount").not().isEmpty().trim().escape().isNumeric(),
  body("operatorId").not().isEmpty().trim().escape(),
  body("partnerRequestId").not().isEmpty().trim().escape().isNumeric(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile, amount, partnerRequestId, operatorId } = req.body;
    const data = await billValidation(
      mobile,
      amount,
      (orderId = partnerRequestId),
      operatorId
    );
    // console.log(data);
    if (data.data.ResponseCode == "00")
      return res.status(200).json({
        error: 0,
        status: "200",
        msg: data.msg,

        data: data.data.BillDetail,
      });
    else
      return res.status(200).json({
        error: 1,
        status: "200",
        msg: data.msg,
      });
  }
);
router.post(
  "/prepaid/validate",
  body("mobile").not().isEmpty().isMobilePhone().trim().escape(),
  body("amount").not().isEmpty().trim().escape().isNumeric(),
  body("operatorId").not().isEmpty().trim().escape(),
  body("partnerRequestId").not().isEmpty().trim().escape().isNumeric(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile, amount, partnerRequestId, operatorId } = req.body;
    const data = await billValidation(
      mobile,
      amount,
      (orderId = partnerRequestId),
      operatorId
    );
    // console.log(data);
    if (data.data.ResponseCode == "00")
      return res.status(200).json({
        error: 0,
        status: "200",
        msg: data.msg,

        data: data.data.RechargePlans,
      });
    else
      return res.status(200).json({
        error: 1,
        status: "200",
        msg: data.msg,
      });
  }
);
router.get(
  "/validate",
  query("mobile").not().isEmpty().isMobilePhone().trim().escape(),
  query("amount").not().isEmpty().trim().escape().isNumeric(),
  query("orderId").not().isEmpty().trim().escape(),
  query("operatorId").not().isEmpty().trim().escape().isNumeric(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile, amount, orderId, operatorId } = req.query;
    const data = await billValidation(mobile, amount, orderId, operatorId);
    return res.status(200).json(data);
  }
);
// router.post(
//   "/prepaidrecharge",
//   body("mobile").not().isEmpty().isMobilePhone().trim().escape(),
//   body("amount").not().isEmpty().trim().escape().isNumeric(),
//   body("partnerRequestId").not().isEmpty().trim().escape(),
//   body("operatorId").not().isEmpty().trim().escape().isNumeric().isInt({
//     min: 1,
//     max: 4,
//   }),
//   async (req, res) => {
//     const validationErrors = validationResult(req);
//     if (!validationErrors.isEmpty()) {
//       return res.status(422).json({
//         error: 422,
//         msg: "error",
//         validationErrors: validationErrors.array({ onlyFirstError: true }),
//       });
//     }
//     const { mobile, amount, partnerRequestId, operatorId } = req.body;
//     const data = await recharge(mobile, amount, partnerRequestId, operatorId);
//     if (data.ResponseCode == "00")
//       return res.status(200).json({
//         error: 0,
//         status: "200",
//         msg: "rechage success",
//       });
//     else
//       return res.status(200).json({
//         error: 1,
//         status: "200",
//         msg: "rechage failed",
//       });
//   }
// );
router.post(
  "/recharge",
  body("mobile").not().isEmpty().isMobilePhone().trim().escape(),
  body("amount").not().isEmpty().trim().escape().isNumeric(),
  body("partnerRequestId").not().isEmpty().trim().escape(),
  body("operatorId").not().isEmpty().trim().escape().isNumeric().isInt({
    min: 1,
    max: 4,
  }),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile, amount, partnerRequestId, operatorId } = req.body;
    const data = await recharge(mobile, amount, partnerRequestId, operatorId);
    console.log(data);
    if (data.data.ResponseCode == "00")
      return res.status(200).json({
        error: 0,
        status: "200",
        msg: "rechage success",
      });
    else
      return res.status(200).json({
        error: 1,
        status: "200",
        msg: "rechage failed |" + data.msg,
      });
  }
);
router.get(
  "/recharge",
  query("mobile").not().isEmpty().isMobilePhone().trim().escape(),
  query("amount").not().isEmpty().trim().escape().isNumeric(),
  query("partnerRequestId").not().isEmpty().trim().escape(),
  query("operatorId").not().isEmpty().trim().escape().isNumeric().isInt({
    min: 1,
    max: 4,
  }),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { mobile, amount, partnerRequestId, operatorId } = req.query;
    const data = await recharge(mobile, amount, partnerRequestId, operatorId);
    if (data.ResponseCode == "00")
      return res.status(200).json({
        error: 0,
        status: "200",
        msg: "rechage success",
      });
    else
      return res.status(200).json({
        error: 1,
        status: "200",
        msg: "rechage failed",
      });
  }
);
router.post(
  "/statuscheck",
  // body("oldOrderId").not().isEmpty().trim().escape(),
  body("partnerRequestId").not().isEmpty().trim().escape(),

  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { partnerRequestId } = req.body;
    const data = await checkStatus(partnerRequestId);
    // console.log(data.data.TxnList[0]);
    if (data.data.ResponseCode == "00")
      return res.status(200).json({
        error: 0,
        status: "200",
        msg: data.msg,
        amount: data.data.TxnList[0].Amount,
        status: data.data.TxnList[0].TxnStatus,
        date: data.data.TxnList[0].TxnDate,
      });
    else
      return res.status(200).json({
        error: 1,
        status: "200",
        msg: data.msg,
      });
    // return res.status(200).json(data);
  }
);

//convert above api to get request
router.get(
  "/statuscheck",
  query("partnerRequestId").not().isEmpty().trim().escape(),
  // query("orderId").not().isEmpty().trim().escape(),
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(422).json({
        error: 422,
        msg: "error",
        validationErrors: validationErrors.array({ onlyFirstError: true }),
      });
    }
    const { partnerRequestId } = req.query;
    // console.log(req.query);
    const data = await checkStatus(partnerRequestId);
    if (data.data.ResponseCode == "00")
      return res.status(200).json({
        error: 0,
        status: "200",
        msg: data.msg,
        amount: data.data.TxnList[0].Amount,
        status: data.data.TxnList[0].TxnStatus,
        date: data.data.TxnList[0].TxnDate,
      });
    else
      return res.status(200).json({
        error: 1,
        status: "200",
        msg: data.msg,
      });
  }
);

module.exports = router;
