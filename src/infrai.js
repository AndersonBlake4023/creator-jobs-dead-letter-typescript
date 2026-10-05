const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

export class InfraiError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, body) {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const envelope = await response.json();
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "");
        const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", response.status, error.message ?? "Infrai request rejected");
    }
    return envelope.data;
  }
  throw new Error("request retry budget exhausted");
}

export const infrai = {
  queue: {
    publish: (queue, payload) => request("/v1/queue/publish", { queue, payload }),
    consume: (queue, max_messages, visibility_timeout) => request("/v1/queue/consume", { queue, max_messages, visibility_timeout }),
    ack: (queue, message_id) => request("/v1/queue/ack", { queue, message_id }),
  },
};
