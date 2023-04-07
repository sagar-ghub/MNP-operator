const bcrept = require('bcrypt');
const manager = require('simple-node-logger').createLogManager();
const { debugLog = false } = require('../../config');
const { defaultCommission } = require('./status');

manager.createConsoleAppender();
const logger = manager.createLogger();
if (debugLog) {
  logger.setLevel('trace');
}

const sanatizeMemberData = (memberData) => {
  delete memberData.member_password;
  delete memberData.last_ip;
  return memberData;
};

const formatUserData = (memberData) => {
  if (memberData.hasOwnProperty('member_ip_address')) {
    memberData.member_ip_address = JSON.parse(memberData.member_ip_address);
  }
  if (memberData.hasOwnProperty('member_permission')) {
    memberData.member_permission = JSON.parse(memberData.member_permission);
  }
  return memberData;
};

const formatDatabaseData = (data) => {
  //for member
  if (data.hasOwnProperty('member_ip_address')) {
    data.member_ip_address = JSON.parse(data.member_ip_address);
  }
  if (data.hasOwnProperty('member_permission')) {
    data.member_permission = JSON.parse(data.member_permission);
  }
  //for commission
  if (data.hasOwnProperty('commission')) {
    try {
      if (data.commission === null) {
        if (data.hasOwnProperty('operator_min_recharge_amount') && data.hasOwnProperty('operator_max_recharge_amount')) {
          data.commission = [{ ...defaultCommission[0], min_recharge: data.operator_min_recharge_amount, max_recharge: data.operator_max_recharge_amount }];
        } else {
          data.commission = defaultCommission;
        }
      } else {
        data.commission = JSON.parse(data.commission);
      }
    } catch (error) {
      if (data.hasOwnProperty('operator_min_recharge_amount') && data.hasOwnProperty('operator_max_recharge_amount')) {
        data.commission = [{ ...defaultCommission[0], min_recharge: data.operator_min_recharge_amount, max_recharge: data.operator_max_recharge_amount }];
      } else {
        data.commission = defaultCommission;
      }
    }
  }
  //for operator
  if (data.hasOwnProperty('operator_recharge_plan')) {
    data.operator_recharge_plan = JSON.parse(data.operator_recharge_plan);
  }
  if (data.hasOwnProperty('operator_provider')) {
    data.operator_provider = JSON.parse(data.operator_provider);
  }
  //for provider
  if (data.hasOwnProperty('provider_service')) {
    data.provider_service = JSON.parse(data.provider_service);
  }
  if (data.hasOwnProperty('opcode')) {
    data.opcode = JSON.parse(data.opcode);
  }
  //for order
  if (data.hasOwnProperty('order_reprocess_provider')) {
    data.order_reprocess_provider = JSON.parse(data.order_reprocess_provider);
  }
  if (data.hasOwnProperty('order_ref')) {
    data.order_ref = JSON.parse(data.order_ref);
  }

  return data;
};

const generateOTP = (digitCount = 8) => {
  let otp = Math.floor(Math.random() * (Math.pow(10, digitCount) - 1)) + '';
  while (otp.length < digitCount) {
    otp = '0' + otp;
  }
  return otp;
};

const generatePasswordHash = (password) => {
  return new Promise((resolve, reject) => {
    bcrept.genSalt(10, (err, salt) => {
      if (err) {
        return reject(err);
      }
      bcrept.hash(password, salt, async (err, hash) => {
        if (err) {
          return reject(err);
        }
        return resolve(hash);
      });
    });
  });
};

const checkPassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrept.compare(password, hash, (err, isMatch) => {
      if (err) {
        reject(err);
      }
      if (isMatch) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const sendResponse = (res, response = { error: 0, msg: 'success' }, http_code = 200) => {
  res.locals.response = response;
  res.locals.http_code = http_code;
  return res.status(http_code).json(response);
};

const catchError = (req, res, error) => {
  logger.debug(req.originalUrl + ' error ' + error);
  return sendResponse(res, { error: 1, msg: 'Something went wrong.' }, 417);
};

const chooseProvider = (providerlist = [], useList = []) => {
  const remaning = providerlist.filter((element) => !useList.includes(element));
  if (remaning.length == 0) {
    return null;
  }
  return remaning[Math.floor(Math.random() * remaning.length)];
};

module.exports = { logger, formatUserData, sanatizeMemberData, checkPassword, generatePasswordHash, generateOTP, catchError, formatDatabaseData, chooseProvider, sendResponse };
