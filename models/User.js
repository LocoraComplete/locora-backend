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

<<<<<<< HEAD
=======
    Bio: {   // ✅ ADD THIS
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    
    ProfilePhoto: {
       type: String,
       default: "",
    },

>>>>>>> 3ba5c80 (Fix language context error and explore screen routing)
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
      maxlength: 13,
    },
    Pronouns: {          // ✅ ADD THIS
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    Gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },

    emergencyContacts: {
      primary: {
        type: String,
        match: [/^\+91\d{10}$/, "Invalid primary emergency number"],
        required: false,
      },
      secondary: {
        type: String,
        match: [/^\+91\d{10}$/, "Invalid secondary emergency number"],
        required: false,
      },
    },
  },
  { timestamps: true }
);
<<<<<<< HEAD

// PRE-SAVE HOOK
userSchema.pre("save", async function () {
  try {
    if (!this.UserId) {
      this.UserId = await getNextSequence("UserId", "U");
    }

    if (!this.Handle && this.Name) {
      this.Handle = "@" + this.Name.replace(/\s+/g, "").toLowerCase();
    }
  } catch (err) {
    console.error("User pre-save error:", err);
    throw err;
  }
});

=======
>>>>>>> 3ba5c80 (Fix language context error and explore screen routing)
const User = mongoose.model("User", userSchema);

module.exports = User;