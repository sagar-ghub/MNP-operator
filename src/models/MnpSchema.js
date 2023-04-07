const mongoose = require("mongoose");

const MnpSchema = new mongoose.Schema({
  mobile: {
    type: Number,
    required: true,
    // unique: true,
  },
  mobile_code: {
    type: Number,
    required: true,
  },
  operator_id: {
    type: Number,
    required: true,
  },
  circle_code: {
    type: Number,
    required: true,
  },
  circle_id: {
    type: Number,
    required: true,
  },
  is_port: {
    type: Number,
    required: true,
  },
});
MnpSchema.index({ mobile: 1 });

module.exports = mongoose.model("MNP", MnpSchema);
