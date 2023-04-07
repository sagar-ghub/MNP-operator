const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
  operator_id: Number,
  operator_name: String,
  circles: [
    {
      circle_id: Number,
      // circle_name: String,
      plan: {
        type: Object,
      },
    },
  ],
});

module.exports = mongoose.model("Plan", PlanSchema);
