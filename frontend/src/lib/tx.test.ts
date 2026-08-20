import { describe, expect, it } from "vitest";
import { runSignedAction } from "./tx";

describe("runSignedAction", () => {
  it("returns hash on success and forwards reporter", async () => {
    const phases: string[] = [];
    const result = await runSignedAction(
      "test_ok",
      async (report) => {
        report("simulating");
        report("signing");
        report("submitted", { hash: "abc123" });
        return "abc123";
      },
      (phase) => phases.push(phase),
    );
    expect(result).toEqual({ ok: true, hash: "abc123" });
    expect(phases).toEqual(["simulating", "signing", "submitted", "success"]);
  });

  it("classifies failures without throwing", async () => {
    const result = await runSignedAction("test_fail", async () => {
      throw new Error("User rejected the request");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("UserRejected");
    }
  });
});
