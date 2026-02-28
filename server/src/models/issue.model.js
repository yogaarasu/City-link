import mongoose from "mongoose";
import { ISSUE_CATEGORIES, ISSUE_STATUS } from "../modules/issues/issue.constants.js";

const IssueStatusLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ISSUE_STATUS,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const IssueVoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["up", "down"],
      required: true,
    },
  },
  { _id: false }
);

const IssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },
    category: {
      type: String,
      enum: ISSUE_CATEGORIES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 250,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: (val) => Array.isArray(val) && val.length <= 5,
        message: "Photos can be up to 5 files only.",
      },
    },
    status: {
      type: String,
      enum: ISSUE_STATUS,
      default: "pending",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upVotes: {
      type: Number,
      default: 0,
    },
    downVotes: {
      type: Number,
      default: 0,
    },
    statusLogs: {
      type: [IssueStatusLogSchema],
      default: [],
    },
    votes: {
      type: [IssueVoteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Issue = mongoose.models.Issue || mongoose.model("Issue", IssueSchema);
