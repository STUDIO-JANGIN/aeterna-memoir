/**
 * Luma AI client (server-only).
 *
 * - Upper layers select 10–25 approved photos and call createLumaVideoJob per tribute clip (~10s, Luma Ray 2).
 * - Five clips per memorial are stored separately; photo selection and slot indexing live in server actions.
 * - HTTP request/state polling is delegated to video-engine.
 */
export type {
  LumaVideoStatus,
  CreateLumaVideoJobOptions,
} from "@/lib/ai/video-engine"

export {
  createLumaVideoJob,
  createLumaVideoJobWithRetry,
  getLumaVideoJob,
  waitForLumaVideoCompletion,
} from "@/lib/ai/video-engine"

