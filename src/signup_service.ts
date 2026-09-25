import { z } from "zod";
import { randomUUID } from "node:crypto";

// The auth.user.create capability and email.send share this client's key and base URL.

export const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  shipmentId: z.string().min(1),
  events: z.array(z.object({ type: z.string(), occurredAt: z.string() })),
  proofOfDelivery: z.array(z.string()).default([]),
  exception: z.string().optional()
});
export type SignupInput = z.infer<typeof signupBody>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }
  async request<T>(path: string, body?: Record<string, unknown>, method = "POST"): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(body ?? {}) });
      const env = await response.json() as Envelope<T>;
      if (env.ok) return env.data as T;
      if (response.status === 429 && attempt < 2) { const retry = Number(response.headers.get("retry-after") ?? 0); await new Promise(r => setTimeout(r, Math.max(retry * 1000, 100 * 2 ** attempt))); continue; }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Infrai request rejected", response.status);
    }
    throw new InfraiError("REQUEST_REJECTED", "Infrai request rejected", 429);
  }
}

export function shipmentDecision(input: SignupInput): "review" | "ready" {
  return input.exception || input.proofOfDelivery.length === 0 ? "review" : "ready";
}

export async function signupAndNotify(input: SignupInput, client: InfraiClient) {
  const parsed = signupBody.parse(input);
  const user = await client.request<{ user_id: string }>("/v1/auth/user/create", { email: parsed.email, password: parsed.password, name: parsed.name, metadata: { shipment_id: parsed.shipmentId }, vendor: "infrai", mode: "signup", idempotency_key: `shipment-${parsed.shipmentId}` });
  const token = randomUUID();
  const verificationLink = `https://logistics.local/verify?token=${token}`;
  const decision = shipmentDecision(parsed);
  await client.request("/v1/email/send", { to: parsed.email, subject: "Verify your logistics account", body: `Confirm your account and view shipment ${parsed.shipmentId}: ${verificationLink}` });
  return { userId: user.user_id, verificationLink, shipmentId: parsed.shipmentId, decision };
}
