"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/browser"
import { raceWithTimeout } from "@/lib/raceWithTimeout"

/** Never block `ready` forever if getUser() hangs (offline, extension, or network stall). */
const AUTH_INIT_TIMEOUT_MS = 8_000
/** Same ceiling as init — `getUser()` has no built-in timeout and can block callers (e.g. sign-out) forever. */
const AUTH_GET_USER_TIMEOUT_MS = 8_000
const GET_USER_TIMEOUT = "timeout" as const

/**
 * Single source of truth for the browser Supabase user.
 * Prefer getUser() (validates JWT) over getSession() alone (can be briefly stale after OAuth).
 *
 * `ready` becomes true after the first auth resolution attempt (or timeout) and stays true after OAuth
 * (SIGNED_IN / TOKEN_REFRESHED) so UI never sticks on “Checking your account…”.
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  /** True after initial auth check completes; also asserted on every auth state change. */
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async (): Promise<User | null> => {
    const res = await raceWithTimeout(supabase.auth.getUser(), AUTH_GET_USER_TIMEOUT_MS, GET_USER_TIMEOUT)
    if (res === GET_USER_TIMEOUT) {
      const { data: sess } = await supabase.auth.getSession()
      const u = sess.session?.user ?? null
      setUser(u)
      return u
    }
    const { data, error } = res
    if (error) {
      const { data: sess } = await supabase.auth.getSession()
      const u = sess.session?.user ?? null
      setUser(u)
      return u
    }
    const u = data.user ?? null
    setUser(u)
    return u
  }, [])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        await Promise.race([
          refresh(),
          new Promise<void>((resolve) => {
            setTimeout(resolve, AUTH_INIT_TIMEOUT_MS)
          }),
        ])
      } catch {
        // Network or transient errors — still unblock UI; listener will sync session.
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        setReady(true)
        return
      }

      // OAuth return, refresh, tab focus: always re-resolve user and unblock UI.
      try {
        const res = await raceWithTimeout(
          supabase.auth.getUser(),
          AUTH_GET_USER_TIMEOUT_MS,
          GET_USER_TIMEOUT,
        )
        if (res === GET_USER_TIMEOUT) {
          setUser(session.user)
        } else {
          const { data, error } = res
          if (error) {
            setUser(session.user)
          } else {
            setUser(data.user ?? session.user)
          }
        }
      } catch {
        setUser(session.user)
      }
      setReady(true)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [refresh])

  return { user, setUser, ready, refresh }
}
