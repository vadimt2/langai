import type { NextRequest } from "next/server"
import { verifyRecaptchaToken, isHuman, isRecaptchaDisabled } from "@/lib/recaptcha"

export const maxDuration = 60 // Set max duration to 60 seconds for audio processing
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    // Check if reCAPTCHA is disabled
    const recaptchaDisabled = isRecaptchaDisabled()

    // Get form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const sourceLanguage = formData.get("sourceLanguage") as string | null
    const recaptchaToken = formData.get("recaptchaToken") as string | null

    // Validate required fields
    if (!file) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Verify reCAPTCHA token if provided and not disabled
    if (!recaptchaDisabled && recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "extract_audio")

      // If verification failed or score is too low, reject the request
      if (!isHuman(recaptchaResult, 0.4)) {
        console.warn("reCAPTCHA verification failed or score too low", recaptchaResult)
        return Response.json(
          {
            error: "Security verification failed. Please try again.",
            recaptchaFailed: true,
          },
          { status: 403 },
        )
      }
    } else if (!recaptchaDisabled && process.env.NODE_ENV === "production") {
      // In production, require reCAPTCHA token unless disabled
      console.warn("Missing reCAPTCHA token in production environment")
      return Response.json({ error: "Security token missing" }, { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("audio/")) {
      return Response.json({ error: "File is not an audio file" }, { status: 400 })
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Read the file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create a unique filename
    const fileName = `audio_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`

    try {
      // Call OpenAI's Whisper API for transcription
      const formData = new FormData()
      formData.append("file", new Blob([buffer], { type: file.type }), fileName)
      formData.append("model", "whisper-1")

      // Add language if provided
      if (sourceLanguage) {
        formData.append("language", sourceLanguage.split("-")[0])
      }

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("OpenAI API error:", errorText)
        return Response.json({ error: "Failed to transcribe audio file" }, { status: response.status })
      }

      const result = await response.json()

      return Response.json({
        text: result.text,
        language: sourceLanguage || "auto-detected",
      })
    } catch (error) {
      console.error("Audio processing error:", error)
      return Response.json({ error: "Failed to process audio file", details: String(error) }, { status: 500 })
    }
  } catch (error) {
    console.error("Unhandled error in audio extraction API:", error)
    return Response.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
