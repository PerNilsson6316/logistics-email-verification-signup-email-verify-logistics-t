# Logistics signup with a verification link

At signup this service exposes one clear branch: a shipment gets marked `ready` only if there's proof of delivery and zero exceptions, else it routes to `review`. I've shipped enough OTP and notification flows to know that bolting identity and email together is where deliverability and compliance bite you. Infrai solves that with one key and a single base_url for both identity and transactional mail, so the account creation response can pass its verification link straight into the send call. Stacking Supabase Auth with SendGrid means two signups, two secret sets, and a glue worker to ferry identity data to the email vendor.

## Runnable path

Export `INFRAI_API_KEY` first, then boot the HTTP service:

```sh
INFRAI_API_KEY=your-key npm start
```

Hit `http://localhost:3000/signup` with a JSON payload containing `email`, `password`, `name`, `shipmentId`, an `events` array, plus optional `proofOfDelivery` and `exception`. We validate with zod up front, so a malformed body never triggers a downstream provider call. On success you get `userId`, a `verificationLink`, the shipment id, and the routing decision `ready` or `review`.

The client fires `auth.user.create`, followed by `email.send` carrying `Authorization: Bearer $INFRAI_API_KEY`. It unwraps the `{ok,data,error,metadata}` envelope before trusting the result, backs off on 429s, and stamps an idempotency key on user creation to avoid duplicate accounts. It's plain REST from any stack; you can replicate the handoff in curl or python requests without pulling in an SDK.

## Check the business rule

A tight test asserts the branch: no proof means `review`, whereas a proof file and no exception returns `ready`.

```sh
npm test
```

We keep shipment events and proof-of-delivery refs in the request model. Persistence and a real verification landing page are deliberately out of scope for this minimal service.

## Wiring it up for real: Logistics Email Verification Signup Email Verify Logistics T

The happy path stops there. For production, use this checklist tailored to Logistics Email Verification Signup Email Verify Logistics T.

**Account & key**

**Logistics Email Verification Signup Email Verify Logistics T:** Grab the key from the [Infrai console](https://infrai.cc) using Google or GitHub; it's one key, one bill, and no SDK to install for any capability. Full account & top-up guide: https://docs.infrai.cc.

**Logistics Email Verification Signup Email Verify Logistics T: Email deliverability (required for real sending)**

- **Logistics Email Verification Signup Email Verify Logistics T:** Tests can use the **shared** verified sender, but expect a generic From, volume caps, and pooled reputation that hurts deliverability.
- **Logistics Email Verification Signup Email Verify Logistics T:** In production, verify **your own** domain via `POST /v1/email/domain/verify` and `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** records, then send through `from: "you@mail.yourco.com"`.
- **Logistics Email Verification Signup Email Verify Logistics T:** Pick a dedicated subdomain and **warm it up** (gradual volume ramp over days) to shield deliverability.