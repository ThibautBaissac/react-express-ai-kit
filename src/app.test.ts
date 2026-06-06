import { createApiApp, healthResponse } from "./apiApp";
import { describe, expect, it } from "vitest";

describe("app", () => {
  it("creates the Express app with the health response", () => {
    const app = createApiApp();

    expect(typeof app).toBe("function");
    expect(healthResponse).toEqual({ status: "ok" });
  });
});
