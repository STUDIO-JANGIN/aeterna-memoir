"use client"

import { useEffect, useState } from "react"

export type PlacePrediction = { description: string; place_id: string }

type ApiResponse = {
  predictions?: PlacePrediction[]
  placesEnabled?: boolean
}

/**
 * Debounced Places suggestions via `/api/place-autocomplete`. When Places is not
 * configured, `placesEnabled` becomes false and predictions stay empty.
 */
export function usePlaceAutocomplete(query: string, active: boolean) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [placesEnabled, setPlacesEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    if (!active) {
      setPredictions([])
      setLoading(false)
      return
    }
    const q = query.trim()
    if (q.length < 3) {
      setPredictions([])
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    const t = window.setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/place-autocomplete?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        const data = (await res.json()) as ApiResponse
        if (typeof data.placesEnabled === "boolean") {
          setPlacesEnabled(data.placesEnabled)
        }
        setPredictions(Array.isArray(data.predictions) ? data.predictions : [])
      } catch {
        if (!ctrl.signal.aborted) setPredictions([])
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 320)

    return () => {
      ctrl.abort()
      window.clearTimeout(t)
    }
  }, [query, active])

  return { predictions, loading, placesEnabled }
}
