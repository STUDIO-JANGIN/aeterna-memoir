"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/browser"

/**
 * Single source of truth for the browser Supabase user.
 * Prefer getUser() (validates JWT) over getSession() alone (can be briefly stale after OAuth).
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null)
  /** True after the first getUser() + subscription setup completes. */
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getUser()
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
    ;(async () => {
      await refresh()
      if (!cancelled) setReady(true)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null)
        return
      }
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? session.user)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [refresh])

  return { user, setUser, ready, refresh }
}
