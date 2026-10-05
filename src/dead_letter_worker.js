import { z } from "zod";
import { infrai } from "./infrai.js";

const queue = "creator-jobs";

export const creatorJob = z.object({
  kind: z.enum(["digital_asset_delivery", "subscriber_update", "content_processing"]),
  creatorId: z.string().min(1),
  assetId: z.string().min(1),
  attempts: z.number().int().nonnegative(),
});

export function shouldDeadLetter(job, failed) {
  return failed && job.attempts >= 3;
}

export async function publishCreatorJob(input) {
  const job = creatorJob.parse(input);
  return infrai.queue.publish(queue, job);
}

export async function drainCreatorJobs(maxMessages = 10) {
  const batch = await infrai.queue.consume(queue, maxMessages, 30);
  const deadLetters = [];
  for (const message of batch.messages) {
    const job = creatorJob.parse(message.payload);
    const failed = job.kind === "content_processing";
    if (shouldDeadLetter(job, failed)) deadLetters.push(job);
    await infrai.queue.ack(queue, message.message_id);
  }
  return deadLetters;
}
