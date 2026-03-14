import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * 일시적 무력화: 리다이렉트 없이 NextResponse.next()만 반환 (아이폰 테스트용).
 * /create 포함 모든 경로 통과.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|api|.*\\..*).*)"],
}
