import { describe, expect, it } from "vitest";
import {
  resolveTeamBySubject,
  SUBJECT_CARD_ISSUE,
  SUBJECT_LOAN_CONTRACT,
} from "./subjectCatalog.js";
import { Team } from "./team.js";

describe("resolveTeamBySubject", () => {
  it("routes exact card subject to Cards", () => {
    expect(resolveTeamBySubject(SUBJECT_CARD_ISSUE)).toBe(Team.Cards);
  });

  it("routes exact loan subject to Loans", () => {
    expect(resolveTeamBySubject(SUBJECT_LOAN_CONTRACT)).toBe(Team.Loans);
  });

  it("routes any other text to Other", () => {
    expect(resolveTeamBySubject("Dúvida geral")).toBe(Team.Other);
    expect(resolveTeamBySubject("")).toBe(Team.Other);
  });

  it("trims whitespace before matching", () => {
    expect(resolveTeamBySubject(`  ${SUBJECT_CARD_ISSUE}  `)).toBe(Team.Cards);
  });

  it("does not match when subject differs from constants", () => {
    expect(resolveTeamBySubject("Problemas com cartao")).toBe(Team.Other);
  });
});
