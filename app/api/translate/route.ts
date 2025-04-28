import { translateText } from "@/lib/translation-service"
import { verifyRecaptchaToken, isHuman, isRecaptchaDisabled } from "@/lib/recaptcha"

export const maxDuration = 60 // Set max duration to 60 seconds for larger documents

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

    const { text, sourceLanguage, targetLanguage, model = "gpt-3.5-turbo", recaptchaToken } = body

    // Validate required fields
    if (!text || !sourceLanguage || !targetLanguage) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if reCAPTCHA is disabled
    const recaptchaDisabled = isRecaptchaDisabled()

    // Verify reCAPTCHA token if provided and not disabled
    if (!recaptchaDisabled && recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "translate")

      // If verification failed or score is too low, reject the request
      if (!isHuman(recaptchaResult, 0.4)) {
        // Using 0.4 as threshold for translation
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

    try {
      const { translatedText, usedFallback } = await translateText(text, sourceLanguage, targetLanguage, model)

      // Return the translated text
      return Response.json({
        translatedText,
        usedFallback,
      })
    } catch (apiError) {
      console.error("API call error:", apiError)
      return Response.json({ error: "Failed to call translation service", details: String(apiError) }, { status: 500 })
    }
  } catch (error) {
    console.error("Unhandled error in translation API:", error)
    return Response.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
