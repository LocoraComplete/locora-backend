//const mongoose = require("mongoose");
//const getNextSequence = require("../utils/generateId");

//const userSchema = new mongoose.Schema(
 /* {
    UserId: { type: String, unique: true },
    Name: { type: String, required: true, trim: true, maxlength: 50 },
    Email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 50 },
    Password: { type: String, required: true, minlength: 6 },
    Phone: { type: String, unique: true, sparse: true, trim: true, maxlength: 15 },
    Gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  },
  { timestamps: true }
);


// ====== PRE-SAVE HOOK ======
userSchema.pre("save", async function () {
  try {
    if (!this.UserId) {
      this.UserId = await getNextSequence("UserId", "U");
    }
  } catch (err) {
    console.error("User pre-save error:", err);
    throw err; // throw the error instead of calling next()
  }
});


const User = mongoose.model("User", userSchema);

module.exports = User;
*/
const mongoose = require("mongoose");
const getNextSequence = require("../utils/generateId");

const userSchema = new mongoose.Schema(
  {
    UserId: { type: String, unique: true },

    Name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    // ✅ AUTO-GENERATED HANDLE (@firstnamelastname)
    Handle: {
      type: String,
      unique: true,
      trim: true,
    },

    Email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },

    Password: {
      type: String,
      required: true,
      minlength: 6,
    },

    Phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 15,
    },

    Gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
  },
  { timestamps: true }
);

// ============================
// PRE-SAVE HOOK
// ============================
userSchema.pre("save", async function () {
  try {
    // Generate custom UserId
    if (!this.UserId) {
      this.UserId = await getNextSequence("UserId", "U");
    }

    // Generate handle ONLY ON FIRST SAVE
    if (!this.Handle && this.Name) {
      this.Handle = "@" + this.Name.replace(/\s+/g, "").toLowerCase();
    }
  } catch (err) {
    console.error("User pre-save error:", err);
    throw err;
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
