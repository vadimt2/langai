import type { NextRequest } from "next/server"
import { verifyRecaptchaToken, isHuman } from "@/lib/recaptcha"

export async function POST(req: NextRequest) {
  try {
    // Get the form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const recaptchaToken = formData.get("recaptchaToken") as string | null

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "extract_document")

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

    // Get file type
    const fileType = file.type

    // For text files, read directly
    if (fileType === "text/plain") {
      try {
        const text = await file.text()
        return Response.json({ extractedText: text })
      } catch (error) {
        console.error("Failed to read text file:", error)
        return Response.json({ error: "Failed to read text file" }, { status: 500 })
      }
    }

    // For PDF files, we now handle them on the client side
    if (fileType === "application/pdf") {
      return Response.json(
        {
          error: "PDF files are now processed on the client side. Please refresh the page and try again.",
        },
        { status: 400 },
      )
    }

    // For other document types (Word, Excel, etc.)
    try {
      // Simple fallback for other document types
      return Response.json({
        extractedText: `This is a placeholder for text extracted from ${file.name}. The actual extraction of ${fileType} files is not fully implemented yet.`,
      })
    } catch (error) {
      console.error("Document extraction error:", error)
      return Response.json(
        {
          error: "Failed to extract text from document",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unhandled error in document extraction API:", error)
    return Response.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
