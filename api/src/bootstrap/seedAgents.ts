import { Team } from "../domain/team.js";
import { AgentModel } from "../models/agentModel.js";

export async function seedAgentsIfEmpty() {
  const count = await AgentModel.countDocuments().exec();
  if (count > 0) {
    return;
  }
  await AgentModel.insertMany([
    { name: "Atendente Cartões 1", team: Team.Cards, activeAssignments: 0 },
    { name: "Atendente Cartões 2", team: Team.Cards, activeAssignments: 0 },
    { name: "Atendente Empréstimos 1", team: Team.Loans, activeAssignments: 0 },
    { name: "Atendente Empréstimos 2", team: Team.Loans, activeAssignments: 0 },
    { name: "Atendente Outros 1", team: Team.Other, activeAssignments: 0 },
    { name: "Atendente Outros 2", team: Team.Other, activeAssignments: 0 },
  ]);
}
