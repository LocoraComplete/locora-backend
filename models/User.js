const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  UserId: {
    type: String,
    unique: true
  },

  Name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },

  Bio: {
    type: String,
    default: "",
    trim: true,
    maxlength: 200
  },

  profilePic: {
    type: String,
    default: ""
  },

  Handle: {
    type: String,
    unique: true,
    trim: true
  },

  Email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 50
  },

  Password: {
    type: String,
    required: true,
    minlength: 6
  },

  Phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: 13
  },

  Pronouns: {
    type: String,
    trim: true,
    maxlength: 30,
    default: ""
  },

  Gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other"
  },

  emergencyContact: {
    type: String,
    match: [/^\+91\d{10}$/, "Invalid emergency number"],
    default: ""
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,

},
{ timestamps: true }
);



/* ======================================================
   AUTO GENERATE HANDLE WHEN USER IS CREATED
====================================================== */

userSchema.pre("save", async function () {

  if (!this.Handle && this.Name) {

    let baseHandle = this.Name.replace(/\s+/g, "").toLowerCase();
    let handle = baseHandle;
    let count = 1;

    const User = this.constructor;

    while (await User.findOne({ Handle: handle })) {

      handle = `${baseHandle}${count}`;
      count++;

    }

    this.Handle = handle;

  }

});



/* ======================================================
   AUTO GENERATE HANDLE WHEN NAME IS UPDATED
====================================================== */

userSchema.pre("findOneAndUpdate", async function () {

  const update = this.getUpdate();

  if (update?.$set?.Name && !update?.$set?.Handle) {

    let baseHandle = update.$set.Name.replace(/\s+/g, "").toLowerCase();
    let handle = baseHandle;
    let count = 1;

    const User = this.model;

    while (await User.findOne({ Handle: handle })) {

      handle = `${baseHandle}${count}`;
      count++;

    }

    this.setUpdate({
      ...update,
      $set: {
        ...update.$set,
        Handle: handle
      }
    });

  }

});



const User = mongoose.model("User", userSchema);

module.exports = User;