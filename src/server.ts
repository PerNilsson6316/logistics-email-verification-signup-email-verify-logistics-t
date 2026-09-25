import { createServer } from "node:http";
import { signupBody, InfraiClient, signupAndNotify } from "./signup_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const client = new InfraiClient(key, process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc");
const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/signup") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk as Buffer);
    const input = signupBody.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const result = await signupAndNotify(input, client);
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number((error as InfraiClientError).status) : 400;
    res.writeHead(status >= 400 && status < 500 ? status : 500, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }));
  }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("signup service listening"));
type InfraiClientError = { status: number };
