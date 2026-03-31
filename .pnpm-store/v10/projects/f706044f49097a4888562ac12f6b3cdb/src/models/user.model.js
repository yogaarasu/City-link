import mongoose from "mongoose";

const UserActivityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  adminId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  phone: {
    type: String,
    default: "",
    trim: true
  },
  district: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ["citizen", "city_admin", "super_admin"],
    default: "citizen"
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  activityLogs: {
    type: [UserActivityLogSchema],
    default: []
  },
  avatar: {
    type: String,
    default: ""
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
