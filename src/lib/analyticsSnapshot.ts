import { Task } from "@/models/Task";

type AnalyticsSnapshot = {
  total: number;
  firstCreatedAt: Date | null;
  activeDays: number;
};

const SNAPSHOT_TTL = 30_000;
let cached: { value: AnalyticsSnapshot; expiresAt: number } | null = null;
let pending: Promise<AnalyticsSnapshot> | null = null;

/** Deduplicates the all-time scan shared by overview and comparison cards. */
export function getAnalyticsSnapshot() {
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
  if (pending) return pending;

  pending = Task.aggregate<{
    _id: null;
    total: number;
    firstCreatedAt: Date;
    activeDays: string[];
  }>([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        firstCreatedAt: { $min: "$createdAt" },
        activeDays: {
          $addToSet: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Ho_Chi_Minh",
            },
          },
        },
      },
    },
  ])
    .then(([result]) => ({
      total: result?.total ?? 0,
      firstCreatedAt: result?.firstCreatedAt ?? null,
      activeDays: result?.activeDays.length ?? 0,
    }))
    .then((value) => {
      cached = { value, expiresAt: Date.now() + SNAPSHOT_TTL };
      return value;
    })
    .finally(() => { pending = null; });

  return pending;
}
