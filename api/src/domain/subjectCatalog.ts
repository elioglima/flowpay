import { Team } from "./team.js";

export const SUBJECT_CARD_ISSUE = "Problemas com cartão";
export const SUBJECT_LOAN_CONTRACT = "Contratação de empréstimo";

export function resolveTeamBySubject(subject: string): Team {
  const trimmed = subject.trim();
  if (trimmed === SUBJECT_CARD_ISSUE) {
    return Team.Cards;
  }
  if (trimmed === SUBJECT_LOAN_CONTRACT) {
    return Team.Loans;
  }
  return Team.Other;
}
