import test from "node:test";
import assert from "node:assert/strict";
import { shipmentDecision, signupBody } from "./signup_service.ts";

test("shipments with an exception or no proof go to review", () => {
  const base = { email: "a@example.com", password: "password123", name: "A", shipmentId: "S-1", events: [{ type: "picked_up", occurredAt: "2026-01-01" }], proofOfDelivery: [] };
  assert.equal(shipmentDecision(signupBody.parse(base)), "review");
  assert.equal(shipmentDecision(signupBody.parse({ ...base, proofOfDelivery: ["pod.pdf"] })), "ready");
});
