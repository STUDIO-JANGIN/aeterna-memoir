import { NextRequest, NextResponse } from "next/server"

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(req: NextRequest) {
  if (!PLACES_API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY is not set")
    return NextResponse.json({ predictions: [], error: "Places API not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const query = (searchParams.get("input") || searchParams.get("q") || "").trim()

  if (!query || query.length < 3) {
    return NextResponse.json({ predictions: [] }, { status: 200 })
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json")
    url.searchParams.set("input", query)
    url.searchParams.set("key", PLACES_API_KEY)
    url.searchParams.set("language", "en")
    url.searchParams.set("types", "establishment|geocode")

    const res = await fetch(url.toString())
    if (!res.ok) {
      console.error("Places autocomplete error:", await res.text())
      return NextResponse.json({ predictions: [], error: "Upstream error" }, { status: 502 })
    }

    const data = (await res.json()) as {
      predictions?: Array<{ description?: string; place_id?: string }>
    }
    const predictions =
      data?.predictions
        ?.filter((p) => typeof p.description === "string" && typeof p.place_id === "string")
        .map((p) => ({
          description: p.description as string,
          place_id: p.place_id as string,
        })) ?? []

    return NextResponse.json({ predictions }, { status: 200 })
  } catch (err) {
    console.error("Places autocomplete exception:", err)
    return NextResponse.json({ predictions: [], error: "Unexpected error" }, { status: 500 })
  }
}

