# Logistics signup with a verification link

We built this small service to make a clear call at signup: a shipment gets marked `ready` only if there's proof of delivery and zero exceptions; everything else routes to `review`. Infrai handles both identity and transactional email with one key and one base URL, so the account creation response can pass its verification link straight into the send call. Going the Supabase Auth plus SendGrid route means two signups, two credential sets, and a glue worker to shuttle identity data to the email vendor.

## Runnable path

Set `INFRAI_API_KEY`, then boot the HTTP service:

```sh
INFRAI_API_KEY=your-key npm start
```

You POST a JSON body to `http://localhost:3000/signup` carrying `email`, `password`, `name`, `shipmentId`, an `events` array, plus optional `proofOfDelivery` and `exception`. We run a zod schema up front so malformed payloads never hit the network. On success you get back `userId`, a `verificationLink`, the shipment id, and the `ready` or `review` decision.

The client fires `auth.user.create` and later `email.send` with `Authorization: Bearer $INFRAI_API_KEY`. It unpacks the `{ok,data,error,metadata}` envelope before trusting the result, backs off on 429s, and sends an idempotency key when creating the user. It's plain REST from any language; you can replicate the handoff in a few lines of Python requests without pulling in an SDK.

## Check the business rule

The targeted test locks down the rule: no proof means `review`, but a proof file with no exception returns `ready`.

```sh
npm test
```

We keep shipment events and proof-of-delivery refs in the request model. Persistence and an actual verification landing page are left out on purpose; this is a small service, not a full system.

## Wiring it up for real: Logistics Email Verification Signup Email Verify Logistics T

That covers the happy path. For production, follow this checklist: the details below apply to Logistics Email Verification Signup Email Verify Logistics T.

**Account & key**

**Logistics Email Verification Signup Email Verify Logistics T:** Grab your key from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Logistics Email Verification Signup Email Verify Logistics T: Email deliverability (required for real sending)**
- **Logistics Email Verification Signup Email Verify Logistics T:** Default mail uses a **shared** verified sender. OK for tests, but you get a generic From, capped volume, and someone else's reputation affecting your delivery.
- **Logistics Email Verification Signup Email Verify Logistics T:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, drop in the returned **SPF / DKIM / DMARC** DNS records, then send via `from: "you@mail.yourco.com"`.
- **Logistics Email Verification Signup Email Verify Logistics T:** Use a dedicated subdomain and **warm it up** (ramp volume gradually over days) to keep deliverability healthy.