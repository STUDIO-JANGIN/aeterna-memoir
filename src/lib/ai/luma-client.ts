/**
 * Luma AI 클라이언트 (서버 전용).
 *
 * - 최대 15장의 사진을 받아 1분 분량의 마법 영상을 생성하는 Job을 만든다.
 * - createLumaVideoJob 호출 전, events/stories 쪽에서 12~15장으로 선별하는 것은 상위 레이어(서버 액션)의 책임이다.
 * - 실제 HTTP 요청/상태 Polling 구현은 video-engine에 위임한다.
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

