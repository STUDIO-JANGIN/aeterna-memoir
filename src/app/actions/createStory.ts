"use server"

import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

const MAX_IMAGE_BYTES = 1024 * 1024 // 1MB
const MAX_WIDTH = 1920
const WEBP_QUALITY_STEPS = [85, 75, 65, 55, 45]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

function logStep(label: string, detail?: Record<string, unknown>) {
  console.log("[createStory]", label, detail !== undefined ? JSON.stringify(detail, null, 0) : "")
}

function logError(label: string, detail: Record<string, unknown>) {
  console.error("[createStory]", label, JSON.stringify(detail, null, 2))
}

export async function createStoryAction(formData: FormData) {
  let eventId: string | null = null
  try {
    // 1) 폼 필드 추출 (slug 또는 eventId로 이벤트 식별)
    const slug = (formData.get("slug") as string | null)?.trim() || null
    const eventIdFromForm = (formData.get("eventId") as string | null)?.trim() || null
    const authorName = (formData.get("author_name") as string | null)?.trim() || null
    const storyText = (formData.get("story_text") as string | null)?.trim() || null
    const file = formData.get("image") as File | null
    const thumbFile = formData.get("thumb") as File | null

    console.log("[createStory] Debug Slug:", slug)
    logStep("1. 폼 데이터 수신", {
      hasSlug: !!slug,
      slugLength: slug?.length ?? 0,
      hasEventId: !!eventIdFromForm,
      eventIdLength: eventIdFromForm?.length ?? 0,
      hasAuthorName: !!authorName,
      hasStoryText: !!storyText,
      hasFile: !!file,
      fileSize: file?.size ?? 0,
      fileName: file?.name ?? null,
    })

    // 2) eventId 결정: slug가 있으면 slug로 조회, 없으면 form의 eventId 사용
    if (slug) {
      const { data: eventRow, error: eventErr } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .single()
      if (eventErr || !eventRow?.id) {
        logError("2. [slug→eventId 조회 단계] 이벤트 없음 (slug 불일치 또는 DB에 slug 미설정)", {
          slug,
          errorMessage: eventErr?.message,
          code: eventErr?.code,
        })
        const e = new Error("Event not found for this page. Please refresh and try again.")
        console.error("Critical Upload Error:", e)
        throw e
      }
      eventId = eventRow.id
      logStep("2. slug → eventId 조회 성공", { slug, eventId })
    } else if (eventIdFromForm) {
      eventId = eventIdFromForm
      logStep("2. form eventId 사용", { eventId })
    }

    if (!eventId) {
      logError("2. eventId 없음 (slug 또는 eventId 필수)", {
        receivedSlug: slug ?? "(없음)",
        receivedEventId: eventIdFromForm ?? "(없음)",
      })
      const e = new Error("Missing event. Please refresh the page and try again.")
      console.error("Critical Upload Error:", e)
      throw e
    }

    if (!authorName || !storyText) {
      logError("3. 검증 실패: 필수 필드 누락", {
        authorName: authorName ? "있음" : "누락",
        storyText: storyText ? "있음" : "누락",
      })
      const e = new Error("Name and story text are required.")
      console.error("Critical Upload Error:", e)
      throw e
    }

    if (!file || file.size === 0) {
      logError("3. 검증 실패: 이미지 없음", {
        hasFile: !!file,
        size: file?.size ?? 0,
      })
      const e = new Error("Please choose a photo to upload.")
      console.error("Critical Upload Error:", e)
      throw e
    }

    // 4) WebP 업로드 버퍼 준비 (클라이언트에서 이미 압축된 WebP를 보내는 경우 그대로 사용, 아니면 서버에서 리사이즈·압축)
    const mainArrayBuffer = await file.arrayBuffer()
    const mainInputBuffer = Buffer.from(mainArrayBuffer)

    let finalMainBuffer: Buffer
    if (file.type === "image/webp" && file.size <= MAX_IMAGE_BYTES) {
      // 브라우저에서 이미 WebP로 충분히 압축된 경우 그대로 사용
      finalMainBuffer = mainInputBuffer
      logStep("4. 클라이언트 WebP 그대로 사용", { bytes: finalMainBuffer.length })
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
      logStep("4. 서버에서 WebP 압축 완료", { bytes: finalMainBuffer.length })
    }

    // 썸네일 버퍼 준비 (클라이언트에서 별도 thumb를 보내면 사용, 아니면 서버에서 생성)
    let finalThumbBuffer: Buffer
    if (thumbFile) {
      const thumbArrayBuffer = await thumbFile.arrayBuffer()
      finalThumbBuffer = Buffer.from(thumbArrayBuffer)
      logStep("4. 클라이언트 썸네일 사용", { bytes: finalThumbBuffer.length })
    } else {
      finalThumbBuffer = await sharp(mainInputBuffer)
        .resize(320, 320, { fit: "cover" })
        .webp({ quality: 60 })
        .toBuffer()
      logStep("4. 서버에서 썸네일 생성", { bytes: finalThumbBuffer.length })
    }

    const timestamp = Date.now()
    const mainPath = `stories/${eventId}/${timestamp}-full.webp`
    const thumbPath = `stories/${eventId}/${timestamp}-thumb.webp`
    logStep("4. Storage 업로드 시작", {
      mainPath,
      thumbPath,
      bucket: "photos",
      mainBytes: finalMainBuffer.length,
      thumbBytes: finalThumbBuffer.length,
    })

    const { data: uploadMain, error: uploadMainError } = await supabase.storage
      .from("photos")
      .upload(mainPath, finalMainBuffer, { cacheControl: "3600", upsert: false, contentType: "image/webp" })

    if (uploadMainError || !uploadMain) {
      logError("4. [Storage 단계] 메인 업로드 실패", {
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
      logError("4. [Storage 단계] 업로드 실패", {
        path: thumbPath,
        message: uploadThumbError?.message,
        name: uploadThumbError?.name,
      })
      const e = new Error("Photo upload failed. Please try again or use a smaller image.")
      console.error("Critical Upload Error:", e)
      console.error("Critical Upload Error (Storage thumb):", uploadThumbError)
      throw e
    }

    logStep("4. Storage 업로드 완료", { mainPath: uploadMain.path, thumbPath: uploadThumb.path })

    const { data: { publicUrl: mainUrl } } = supabase.storage.from("photos").getPublicUrl(mainPath)
    const { data: { publicUrl: thumbUrl } } = supabase.storage.from("photos").getPublicUrl(thumbPath)

    // 5) DB 저장
    logStep("5. DB 저장 시작", { event_id: eventId })

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
      logError("5. [DB Insert 단계] 저장 실패", {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
      })
      const e = new Error("Could not save your story. Please try again.")
      console.error("Critical Upload Error:", e)
      console.error("Critical Upload Error (DB Insert):", insertError)
      throw e
    }

    logStep("6. DB 저장 완료", { storyId: inserted?.id })
    return { ok: true, storyId: inserted?.id ?? null }
  } catch (err: unknown) {
    console.error("Critical Upload Error:", err)
    if (err instanceof Error && err.stack) {
      console.error("Critical Upload Error Stack:", err.stack)
    }
    const message = err instanceof Error ? err.message : String(err)
    logError("예외 발생", {
      message,
      name: err instanceof Error ? err.name : undefined,
      eventId: eventId ?? "(미결정)",
    })
    throw err
  }
}
