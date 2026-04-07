"use server"

import { getSupabaseAdmin } from "@/lib/supabaseAdmin"
import sharp from "sharp"

const MAX_IMAGE_BYTES = 1024 * 1024 // 1MB
const MAX_WIDTH = 1920
const WEBP_QUALITY_STEPS = [85, 75, 65, 55, 45]

function logError(label: string, detail: Record<string, unknown>) {
  console.error("[createStory]", label, JSON.stringify(detail, null, 2))
}

export async function createStoryAction(formData: FormData) {
  const supabase = getSupabaseAdmin()
  let eventId: string | null = null
  try {
    // 1) Extract form fields (identify event by slug or eventId)
    const slug = (formData.get("slug") as string | null)?.trim() || null
    const eventIdFromForm = (formData.get("eventId") as string | null)?.trim() || null
    const authorName = (formData.get("author_name") as string | null)?.trim() || null
    const storyText = (formData.get("story_text") as string | null)?.trim() || null
    const file = formData.get("image") as File | null
    const thumbFile = formData.get("thumb") as File | null

    // 2) Resolve eventId: use slug lookup when present, otherwise use form eventId.
    if (slug) {
      const { data: eventRow, error: eventErr } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single()
      if (eventErr || !eventRow?.id) {
        logError("2. [slug→eventId lookup] Event not found (slug mismatch or slug missing in DB)", {
          slug,
          errorMessage: eventErr?.message,
          code: eventErr?.code,
        })
        const e = new Error("Event not found for this page. Please refresh and try again.")
        console.error("Critical Upload Error:", e)
        throw e
      }
      eventId = eventRow.id
    } else if (eventIdFromForm) {
      eventId = eventIdFromForm
    }

    if (!eventId) {
      logError("2. Missing eventId (slug or eventId required)", {
        receivedSlug: slug ?? "(none)",
        receivedEventId: eventIdFromForm ?? "(none)",
      })
      const e = new Error("Missing event. Please refresh the page and try again.")
      console.error("Critical Upload Error:", e)
      throw e
    }

    if (!authorName || !storyText) {
      logError("3. Validation failed: required fields missing", {
        authorName: authorName ? "present" : "missing",
        storyText: storyText ? "present" : "missing",
      })
      const e = new Error("Name and story text are required.")
      console.error("Critical Upload Error:", e)
      throw e
    }

    if (!file || file.size === 0) {
      logError("3. Validation failed: image missing", {
        hasFile: !!file,
        size: file?.size ?? 0,
      })
      const e = new Error("Please choose a photo to upload.")
      console.error("Critical Upload Error:", e)
      throw e
    }

    // 4) Prepare WebP upload buffer (use client-compressed WebP as-is, else resize/compress on server).
    const mainArrayBuffer = await file.arrayBuffer()
    const mainInputBuffer = Buffer.from(mainArrayBuffer)

    let finalMainBuffer: Buffer
    if (file.type === "image/webp" && file.size <= MAX_IMAGE_BYTES) {
      // If already compressed sufficiently as WebP in browser, use as-is.
      finalMainBuffer = mainInputBuffer
    } else {
      let buffer: Buffer | null = null
      for (const q of WEBP_QUALITY_STEPS) {
        buffer = await sharp(mainInputBuffer)
          .resize(MAX_WIDTH, null, { withoutEnlargement: true })
          .webp({ quality: q })
          .toBuffer()
        if (buffer.length <= MAX_IMAGE_BYTES) break
      }
      if (buffer && buffer.length > MAX_IMAGE_BYTES) {
        buffer = await sharp(mainInputBuffer)
          .resize(Math.floor(MAX_WIDTH * 0.7), null, { withoutEnlargement: true })
          .webp({ quality: 50 })
          .toBuffer()
      }
      finalMainBuffer = buffer ?? (await sharp(mainInputBuffer).resize(MAX_WIDTH).webp({ quality: 50 }).toBuffer())
    }

    // Prepare thumbnail buffer (use client thumb if provided, else generate on server).
    let finalThumbBuffer: Buffer
    if (thumbFile) {
      const thumbArrayBuffer = await thumbFile.arrayBuffer()
      finalThumbBuffer = Buffer.from(thumbArrayBuffer)
    } else {
      finalThumbBuffer = await sharp(mainInputBuffer)
        .resize(320, 320, { fit: "cover" })
        .webp({ quality: 60 })
        .toBuffer()
    }

    const timestamp = Date.now()
    const mainPath = `stories/${eventId}/${timestamp}-full.webp`
    const thumbPath = `stories/${eventId}/${timestamp}-thumb.webp`

    const { data: uploadMain, error: uploadMainError } = await supabase.storage
      .from("photos")
      .upload(mainPath, finalMainBuffer, { cacheControl: "3600", upsert: false, contentType: "image/webp" })

    if (uploadMainError || !uploadMain) {
      logError("4. [Storage stage] Main upload failed", {
        path: mainPath,
        message: uploadMainError?.message,
        name: uploadMainError?.name,
      })
      const e = new Error("Photo upload failed. Please try again or use a smaller image.")
      console.error("Critical Upload Error:", e)
      console.error("Critical Upload Error (Storage main):", uploadMainError)
      throw e
    }

    const { data: uploadThumb, error: uploadThumbError } = await supabase.storage
      .from("photos")
      .upload(thumbPath, finalThumbBuffer, { cacheControl: "3600", upsert: false, contentType: "image/webp" })

    if (uploadThumbError || !uploadThumb) {
      logError("4. [Storage stage] Upload failed", {
        path: thumbPath,
        message: uploadThumbError?.message,
        name: uploadThumbError?.name,
      })
      const e = new Error("Photo upload failed. Please try again or use a smaller image.")
      console.error("Critical Upload Error:", e)
      console.error("Critical Upload Error (Storage thumb):", uploadThumbError)
      throw e
    }

    const { data: { publicUrl: mainUrl } } = supabase.storage.from("photos").getPublicUrl(mainPath)
    const { data: { publicUrl: thumbUrl } } = supabase.storage.from("photos").getPublicUrl(thumbPath)

    // 5) Save in DB
    const { data: inserted, error: insertError } = await supabase
      .from("stories")
      .insert([
        {
          event_id: eventId,
          author_name: authorName,
          story_text: storyText,
          image_url: mainUrl,
          thumb_url: thumbUrl,
          is_approved: false,
        },
      ])
      .select("id")
      .single()

    if (insertError) {
      logError("5. [DB insert stage] Save failed", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
      })
      const e = new Error("Could not save your story. Please try again.")
      console.error("Critical Upload Error:", e)
      console.error("Critical Upload Error (DB Insert):", insertError)
      throw e
    }

    return { ok: true, storyId: inserted?.id ?? null }
  } catch (err: unknown) {
    console.error("Critical Upload Error:", err)
    if (err instanceof Error && err.stack) {
      console.error("Critical Upload Error Stack:", err.stack)
    }
    const message = err instanceof Error ? err.message : String(err)
    logError("Unhandled exception", {
      message,
      name: err instanceof Error ? err.name : undefined,
      eventId: eventId ?? "(unresolved)",
    })
    throw err
  }
}
