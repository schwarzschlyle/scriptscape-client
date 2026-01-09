const KEY = "aiJobs:v1";

export type AiJobType = "segments" | "visuals" | "storyboard_sketch";

export type AiJobRecord = {
  jobId: string;
  type: AiJobType;
  createdAt: number;
  meta?: Record<string, any>;
};

export function updateAiJob(type: AiJobType, jobId: string, patch: Partial<AiJobRecord>) {
  const records = readAll();
  const next = records.map((r) =>
    r.type === type && r.jobId === jobId
      ? { ...r, ...patch, meta: { ...(r.meta || {}), ...(patch.meta || {}) } }
      : r
  );
  writeAll(next);
}

function readAll(): AiJobRecord[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AiJobRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: AiJobRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function addAiJob(record: AiJobRecord) {
  const records = readAll();
  const next = [record, ...records.filter((r) => !(r.jobId === record.jobId && r.type === record.type))];
  writeAll(next);
}

export function removeAiJob(type: AiJobType, jobId: string) {
  const records = readAll();
  writeAll(records.filter((r) => !(r.type === type && r.jobId === jobId)));
}

/** Remove any jobs matching a predicate. Useful for cascade-deletes/cancellations. */
export function removeAiJobsWhere(predicate: (job: AiJobRecord) => boolean) {
  const records = readAll();
  writeAll(records.filter((r) => !predicate(r)));
}

export function listAiJobs(type?: AiJobType): AiJobRecord[] {
  const records = readAll();
  return type ? records.filter((r) => r.type === type) : records;
}

export function pruneAiJobs(maxAgeMs: number) {
  const cutoff = Date.now() - maxAgeMs;
  const records = readAll();
  writeAll(records.filter((r) => (r.createdAt || 0) >= cutoff));
}
