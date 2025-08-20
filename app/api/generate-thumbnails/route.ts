import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

interface ThumbnailRequest {
  title: string
  context: string
  prompt: string
  referenceImageUrl: string
  personPhotoBase64: string | null
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 })
  }

  const body: ThumbnailRequest = await req.json()
  const prompt = buildPrompt(body)

  /** Helper that actually calls OpenAI */
  async function createImage(size: "1792x1024" | "1024x1024") {
    return openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "hd",
    })
  }

  try {
    // 1) Try the wide 16:9-ish size first (may fail for some orgs)
    let response
    try {
      response = await createImage("1792x1024")
    } catch (err) {
      // Log & fall back to the official 1:1 size
      console.error("OpenAI call failed, falling back to 1024×1024", err)
      response = await createImage("1024x1024")
    }

    const url = response.data?.[0]?.url
    if (!url) {
      throw new Error("No image URL returned from OpenAI.")
    }

    return NextResponse.json({
      thumbnails: [{ id: "t1", url, prompt }],
    })
  } catch (err: any) {
    // OpenAI returns structured errors — surface the message
    const message = err?.message ?? err?.response?.data?.error?.message ?? "Unknown server error"

    console.error("Thumbnail generation error:", err)

    const status = err?.response?.status && Number(err.response.status) >= 400 ? err.response.status : 500

    return NextResponse.json({ error: message }, { status })
  }
}

/** Prompt builder */
function buildPrompt(data: ThumbnailRequest) {
  const { title, context, prompt } = data
  const titleText = `"${title.trim()}"`

  return [
    `Create a professional YouTube thumbnail with the title text ${titleText} in large, bold, readable lettering.`,
    context && `The video is about: ${context.trim()}.`,
    prompt && `Style preferences: ${prompt.trim()}.`,
    "Use bright, high-contrast colours and a dramatic composition that grabs attention.",
    "16:9 aspect ratio, click-worthy design, modern YouTube style.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 1000) // DALL-E prompt limit
}
