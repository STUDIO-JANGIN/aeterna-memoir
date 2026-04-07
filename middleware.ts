import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Temporarily disabled: return NextResponse.next() only, no redirects (for iPhone testing).
 * All routes pass through, including /create.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|api|.*\\..*).*)"],
}
