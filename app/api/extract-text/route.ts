import { verifyRecaptchaToken, isHuman } from "@/lib/recaptcha"

export async function POST(req: Request) {
  try {
    // Check if the request is a multipart form
    const formData = await req.formData()
    const imageFile = formData.get("image") as File | null
    const recaptchaToken = formData.get("recaptchaToken") as string | null

    if (!imageFile) {
      return Response.json({ error: "No image file provided" }, { status: 400 })
    }

    // Check file size (limit to 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return Response.json({ error: "Image file too large (max 5MB)" }, { status: 400 })
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "extract_text")

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

    // Convert the file to base64
    const buffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(buffer).toString("base64")

    // Call OpenAI's Vision model to extract text from the image
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o", // Updated from gpt-4-vision-preview to gpt-4o
          messages: [
            {
              role: "system",
              content:
                "You are a text extraction system. Extract all visible text from the image. Return only the extracted text without any additional explanations or notes.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all the text from this image. Return only the extracted text, exactly as it appears, with line breaks preserved.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      })

      // Check if OpenAI response is OK
      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.text()
        console.error("OpenAI API error:", errorData)
        return Response.json({ error: "Text extraction service error", details: errorData }, { status: 500 })
      }

      // Parse OpenAI response
      const openaiData = await openaiResponse.json()
      const extractedText = openaiData.choices[0]?.message?.content?.trim() || ""

      // Return the extracted text
      return Response.json({ extractedText })
    } catch (apiError) {
      console.error("API call error:", apiError)
      return Response.json(
        { error: "Failed to call text extraction service", details: String(apiError) },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in text extraction API:", error)
    return Response.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
