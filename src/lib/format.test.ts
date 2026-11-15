import { describe, expect, it } from "vitest";
import { parisLocalToIso, dayKey } from "./format";

describe("fuseau Europe/Paris", () => {
  it("convertit l'heure d'été (UTC+2)", () => expect(parisLocalToIso("2026-07-01", "10:00")).toBe("2026-07-01T08:00:00.000Z"));
  it("convertit l'heure d'hiver (UTC+1)", () => expect(parisLocalToIso("2026-12-01", "10:00")).toBe("2026-12-01T09:00:00.000Z"));
  it("dayKey", () => expect(dayKey("2026-12-01T23:30:00.000Z")).toBe("2026-12-02"));
});
