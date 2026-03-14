import { NextRequest, NextResponse } from "next/server"

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME

export async function POST(req: NextRequest) {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.error("CLOUDINARY_CLOUD_NAME is not set")
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const imageUrl = (body.imageUrl as string | undefined)?.trim()
  const publicId = (body.publicId as string | undefined)?.trim()

  if (!imageUrl && !publicId) {
    return NextResponse.json({ error: "Provide either imageUrl or publicId" }, { status: 400 })
  }

  // Skeleton: we don't perform any network call here yet.
  // Instead we return a Cloudinary URL that applies gentle enhancements.
  //
  // For a fetched URL:
  //   https://res.cloudinary.com/<cloud>/image/fetch/e_improve,q_auto,f_auto/<encoded-image-url>
  //
  // For an uploaded publicId:
  //   https://res.cloudinary.com/<cloud>/image/upload/e_improve,q_auto,f_auto/<publicId>

  let enhancedUrl: string
  if (imageUrl) {
    enhancedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/e_improve,q_auto,f_auto/${encodeURIComponent(
      imageUrl,
    )}`
  } else {
    enhancedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/e_improve,q_auto,f_auto/${encodeURIComponent(
      publicId as string,
    )}`
  }

  return NextResponse.json({ url: enhancedUrl }, { status: 200 })
}

