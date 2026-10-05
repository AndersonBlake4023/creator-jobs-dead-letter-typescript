import test from "node:test";
import assert from "node:assert/strict";
import { creatorJob, shouldDeadLetter } from "../src/dead_letter_worker.js";

test("content processing reaches the dead-letter decision after three attempts", () => {
  const job = creatorJob.parse({ kind: "content_processing", creatorId: "c_42", assetId: "video_7", attempts: 3 });
  assert.equal(shouldDeadLetter(job, true), true);
  assert.equal(shouldDeadLetter({ ...job, attempts: 2 }, true), false);
  assert.equal(shouldDeadLetter(job, false), false);
});
