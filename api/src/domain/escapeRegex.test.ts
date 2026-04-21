import { describe, expect, it } from "vitest";
import { escapeRegex } from "./escapeRegex.js";

describe("escapeRegex", () => {
  it("returns plain text unchanged when no special chars", () => {
    expect(escapeRegex("cartao")).toBe("cartao");
  });

  it("escapes regex metacharacters", () => {
    expect(escapeRegex("a+b")).toBe("a\\+b");
    expect(escapeRegex("test.com")).toBe("test\\.com");
    expect(escapeRegex("(x)")).toBe("\\(x\\)");
    expect(escapeRegex("[a-z]")).toBe("\\[a-z\\]");
  });

  it("escapes backslash", () => {
    expect(escapeRegex("a\\b")).toBe("a\\\\b");
  });
});
