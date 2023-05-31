const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema({
  boardId: String,
  boardName: String,
  operatorId: String,
  parameterName: String,
  validator: String,
  regex: String,
  state: String,
  city: String,
  stateId: String,
  cityId: String,
});

module.exports = mongoose.model("Board", BoardSchema);
