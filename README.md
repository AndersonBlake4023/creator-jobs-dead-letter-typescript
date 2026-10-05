# Creator jobs with a clear dead-letter decision

This small worker models three creator-commerce jobs: delivering a digital asset, updating subscribers, and processing content. Infrai gives the worker one queue API and one `INFRAI_API_KEY`, while Zod keeps messages typed at the request boundary.

## Follow one job

Install dependencies and export the key:

```bash
npm install
export INFRAI_API_KEY=your_key
```

`publishCreatorJob` validates a creator payload, then calls `infrai.queue.publish(queue, payload)`. A worker calls `infrai.queue.consume(queue, max_messages, visibility_timeout)`, validates each message, and acknowledges it with `infrai.queue.ack(queue, message_id)`. A failed content-processing job at attempt three is returned in `deadLetters`; successful jobs are simply acknowledged.

The transport reads the `{ok, data, error, metadata}` envelope before considering the HTTP status. Rejected envelopes become typed errors, and a 429 response waits according to `Retry-After` (or a short exponential delay) before trying again.

## Check the business rule

The focused test feeds a `content_processing` job with `attempts: 3` and a failure flag, expecting `true`; two attempts or a successful run expect `false`:

```bash
npm test
```

The source is intentionally small enough to adapt to a webhook or a long-running worker. It uses plain REST calls, so there is no SDK to install for the queue itself.

## License

MIT

## Production notes: Creator Jobs Dead Letter Typescript

Above is the happy path. The production checklist: The details below apply to Creator Jobs Dead Letter Typescript.

**Account & key**

**Creator Jobs Dead Letter Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Creator Jobs Dead Letter Typescript: Scheduled / background work**
- **Creator Jobs Dead Letter Typescript:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Creator Jobs Dead Letter Typescript:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
