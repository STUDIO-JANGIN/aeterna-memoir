/**
 * Luma AI client (server-only).
 *
 * - Accepts up to 15 photos and creates a job for a 1-minute cinematic film.
 * - Selecting 12–15 photos before createLumaVideoJob is handled by upper layers (server actions).
 * - HTTP request/state polling is delegated to video-engine.
 */
export type {
  LumaVideoStatus,
  CreateLumaVideoJobOptions,
} from "@/lib/ai/video-engine"

export {
  createLumaVideoJob,
  getLumaVideoJob,
  waitForLumaVideoCompletion,
} from "@/lib/ai/video-engine"

