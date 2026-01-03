const Counter = require("../models/Counter");

async function getNextSequence(name, prefix) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}${counter.seq.toString().padStart(3, "0")}`;
}

module.exports = getNextSequence;
