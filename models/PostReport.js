const mongoose = require("mongoose");

const postReportSchema = new mongoose.Schema(
  {
    ReportId: {
      type: String,
      unique: true,
    },
    PostId: {
      type: String,
      required: true,
    },
    ReportedBy: {
      type: String,
      required: true,
    },
    PostOwnerId: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PostReport", postReportSchema);