import mongoose from "mongoose";
import { escapeRegex } from "../domain/escapeRegex.js";
import { resolveTeamBySubject } from "../domain/subjectCatalog.js";
import {
  TicketInvalidStateError,
  TicketNotFoundError,
} from "../domain/ticketErrors.js";

export { TicketInvalidStateError, TicketNotFoundError };
import { MAX_CONCURRENT_PER_AGENT, Team } from "../domain/team.js";
import { AgentModel } from "../models/agentModel.js";
import { TicketModel } from "../models/ticketModel.js";
import { broadcastSse } from "../infrastructure/sse/sseHub.js";
import { mapTicket } from "./ticketMapper.js";

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function assignNextFromQueue(team: Team) {
  const hasQueued = await TicketModel.exists({ team, status: "queued" }).exec();
  if (hasQueued) {
    await delayMs(500);
  }
  const agent = await AgentModel.findOneAndUpdate(
    { team, activeAssignments: { $lt: MAX_CONCURRENT_PER_AGENT } },
    { $inc: { activeAssignments: 1 } },
    { sort: { activeAssignments: 1 }, new: true }
  ).exec();
  if (!agent) {
    return;
  }
  const updated = await TicketModel.findOneAndUpdate(
    { team, status: "queued" },
    { $set: { status: "active", agentId: agent._id, activeAt: new Date() } },
    { sort: { createdAt: 1 }, new: true }
  ).exec();
  if (!updated) {
    await AgentModel.findByIdAndUpdate(agent._id, {
      $inc: { activeAssignments: -1 },
    }).exec();
  }
}

async function buildSnapshot() {
  const agents = await AgentModel.find().sort({ team: 1, name: 1 }).lean().exec();
  const openTickets = await TicketModel.find({
    status: { $in: ["queued", "active"] },
  })
    .sort({ createdAt: -1 })
    .populate("agentId", "name")
    .lean()
    .exec();
  const queueLengths: Record<Team, number> = {
    [Team.Cards]: await TicketModel.countDocuments({
      team: Team.Cards,
      status: "queued",
    }).exec(),
    [Team.Loans]: await TicketModel.countDocuments({
      team: Team.Loans,
      status: "queued",
    }).exec(),
    [Team.Other]: await TicketModel.countDocuments({
      team: Team.Other,
      status: "queued",
    }).exec(),
  };
  const closedByTeam: Record<Team, number> = {
    [Team.Cards]: await TicketModel.countDocuments({
      team: Team.Cards,
      status: "closed",
    }).exec(),
    [Team.Loans]: await TicketModel.countDocuments({
      team: Team.Loans,
      status: "closed",
    }).exec(),
    [Team.Other]: await TicketModel.countDocuments({
      team: Team.Other,
      status: "closed",
    }).exec(),
  };
  return {
    agents: agents.map((a) => ({
      id: String(a._id),
      name: a.name,
      team: a.team,
      activeAssignments: a.activeAssignments,
      capacity: MAX_CONCURRENT_PER_AGENT,
    })),
    openTickets: openTickets.map(mapTicket),
    recentClosed: [],
    queueLengths,
    closedByTeam,
  };
}

export async function getDashboardSnapshot() {
  return buildSnapshot();
}

export async function listClosedTickets(opts: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const filter: Record<string, unknown> = { status: "closed" };
  const trimmed = opts.q?.trim();
  if (trimmed) {
    filter.subject = new RegExp(escapeRegex(trimmed), "i");
  }
  const skip = (opts.page - 1) * opts.pageSize;
  const [raw, total] = await Promise.all([
    TicketModel.find(filter as mongoose.FilterQuery<unknown>)
      .sort({ closedAt: -1 })
      .skip(skip)
      .limit(opts.pageSize)
      .populate("agentId", "name")
      .lean()
      .exec(),
    TicketModel.countDocuments(filter as mongoose.FilterQuery<unknown>).exec(),
  ]);
  return {
    items: raw.map((doc) => mapTicket(doc as unknown as Record<string, unknown>)),
    total,
    page: opts.page,
    pageSize: opts.pageSize,
  };
}

async function pushDashboard() {
  const snapshot = await buildSnapshot();
  broadcastSse({ type: "dashboard", payload: snapshot });
}

export async function resetSimulationState() {
  await TicketModel.deleteMany({}).exec();
  await AgentModel.updateMany({}, { $set: { activeAssignments: 0 } }).exec();
  await pushDashboard();
}

export async function createTicket(subject: string) {
  const team = resolveTeamBySubject(subject);
  const agent = await AgentModel.findOneAndUpdate(
    { team, activeAssignments: { $lt: MAX_CONCURRENT_PER_AGENT } },
    { $inc: { activeAssignments: 1 } },
    { sort: { activeAssignments: 1 }, new: true }
  ).exec();
  let createdId: string;
  if (agent) {
    try {
      const now = new Date();
      const doc = await TicketModel.create({
        subject,
        team,
        status: "active",
        agentId: agent._id,
        activeAt: now,
      });
      createdId = String(doc._id);
    } catch (err) {
      await AgentModel.findByIdAndUpdate(agent._id, {
        $inc: { activeAssignments: -1 },
      }).exec();
      throw err;
    }
  } else {
    const doc = await TicketModel.create({
      subject,
      team,
      status: "queued",
    });
    createdId = String(doc._id);
  }
  await pushDashboard();
  const ticket = await TicketModel.findById(createdId)
    .populate("agentId", "name")
    .lean()
    .exec();
  if (!ticket) {
    throw new Error("ticket persist failed");
  }
  return mapTicket(ticket as unknown as Record<string, unknown>);
}

export async function completeTicket(ticketId: string) {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new TicketNotFoundError();
  }
  const ticket = await TicketModel.findOne({
    _id: ticketId,
    status: "active",
  }).exec();
  if (!ticket) {
    const exists = await TicketModel.findById(ticketId).exec();
    if (!exists) {
      throw new TicketNotFoundError();
    }
    throw new TicketInvalidStateError();
  }
  if (!ticket.agentId) {
    throw new TicketInvalidStateError();
  }
  const dec = await AgentModel.findOneAndUpdate(
    { _id: ticket.agentId, activeAssignments: { $gte: 1 } },
    { $inc: { activeAssignments: -1 } },
    { new: true }
  ).exec();
  if (!dec) {
    throw new TicketInvalidStateError();
  }
  try {
    ticket.status = "closed";
    ticket.closedAt = new Date();
    await ticket.save();
  } catch (err) {
    await AgentModel.findByIdAndUpdate(ticket.agentId, {
      $inc: { activeAssignments: 1 },
    }).exec();
    throw err;
  }
  await delayMs(200);
  await assignNextFromQueue(ticket.team as Team);
  await pushDashboard();
}
