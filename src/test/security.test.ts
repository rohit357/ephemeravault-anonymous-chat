import { describe, it, expect } from "vitest";
import { generateCode } from "../context/ChatContext";

describe("generateCode", () => {
  const VALID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  it("should generate a 6-character code", () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
  });

  it("should only contain valid characters", () => {
    const code = generateCode();
    for (const char of code) {
      expect(VALID_CHARS).toContain(char);
    }
  });

  it("should generate different codes (basic randomness check)", () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCode());
    }
    // With 32^6 possibilities, the chance of collision in 100 samples is very low.
    expect(codes.size).toBe(100);
  });
});
