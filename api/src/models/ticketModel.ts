import mongoose from "mongoose";
import { Team } from "../domain/team.js";

const ticketSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    team: {
      type: String,
      enum: Object.values(Team),
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "active", "closed"],
      required: true,
    },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "Agent", required: false },
    activeAt: { type: Date, required: false },
    closedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

ticketSchema.index({ team: 1, status: 1, createdAt: 1 });

export type TicketDocument = mongoose.InferSchemaType<typeof ticketSchema>;
export const TicketModel =
  mongoose.models.Ticket ?? mongoose.model("Ticket", ticketSchema);
