import { detectLanguage } from "@/lib/translation-service"
import { verifyRecaptchaToken, isHuman } from "@/lib/recaptcha"

export async function POST(req: Request) {
  try {
    // Parse the request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("Failed to parse request body:", error)
      return Response.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { text, recaptchaToken } = body

    if (!text || text.trim().length === 0) {
      return Response.json({ error: "Missing or empty text" }, { status: 400 })
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "detect_language")

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
    } else if (process.env.NODE_ENV === "production") {
      // In production, require reCAPTCHA token
      console.warn("Missing reCAPTCHA token in production environment")
      return Response.json({ error: "Security token missing" }, { status: 400 })
    }

    try {
      const result = await detectLanguage(text)
      return Response.json(result)
    } catch (apiError) {
      console.error("API call error:", apiError)
      return Response.json(
        { error: "Failed to call language detection service", details: String(apiError) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in language detection API:", error)
    return Response.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
