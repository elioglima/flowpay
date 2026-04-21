import mongoose from "mongoose";
import { Team } from "../domain/team.js";

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    team: {
      type: String,
      enum: Object.values(Team),
      required: true,
    },
    activeAssignments: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 3,
    },
  },
  { timestamps: true }
);

agentSchema.index({ team: 1, activeAssignments: 1 });

export const AgentModel =
  mongoose.models.Agent ?? mongoose.model("Agent", agentSchema);
