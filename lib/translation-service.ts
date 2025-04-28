import { detectLanguageFromText } from "@/utils/language-detection"
import { fallbackTranslate } from "@/utils/fallback-translation"

// Cache for translations to avoid redundant API calls
const translationCache = new Map<string, string>()

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  model = "gpt-3.5-turbo",
) {
  try {
    // If source and target languages are the same, return the original text
    if (sourceLanguage === targetLanguage) {
      return { translatedText: text, usedFallback: false }
    }

    // Check cache first
    const cacheKey = `${text.substring(0, 100)}_${sourceLanguage}_${targetLanguage}_${model}`
    if (translationCache.has(cacheKey) && text.length < 1000) {
      return { translatedText: translationCache.get(cacheKey)!, usedFallback: false }
    }

    // Create a simple prompt for translation
    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Preserve formatting, paragraph breaks, and maintain the original meaning:

${text}

Translation:`

    // Make a direct fetch request to OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator. Provide only the translated text without any additional explanations or notes. Preserve all formatting, paragraph breaks, and maintain the original meaning.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000, // Increased token limit for larger chunks
      }),
    })

    // Check if OpenAI response is OK
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error("OpenAI API error:", errorData)

      // Use fallback translation as a backup
      return {
        translatedText: fallbackTranslate(text, sourceLanguage, targetLanguage),
        usedFallback: true,
      }
    }

    // Parse OpenAI response
    const openaiData = await openaiResponse.json()
    const translatedText = openaiData.choices[0]?.message?.content?.trim() || ""

    // Cache the result for small texts
    if (text.length < 1000) {
      translationCache.set(cacheKey, translatedText)

      // Limit cache size to prevent memory issues
      if (translationCache.size > 100) {
        const firstKey = translationCache.keys().next().value
        translationCache.delete(firstKey)
      }
    }

    // Return the translated text
    return { translatedText, usedFallback: false }
  } catch (apiError) {
    console.error("API call error:", apiError)

    // Use fallback translation as a backup
    return {
      translatedText: fallbackTranslate(text, sourceLanguage, targetLanguage),
      usedFallback: true,
    }
  }
}

export async function detectLanguage(text: string) {
  try {
    // First try client-side detection for common patterns
    const clientDetectedLang = detectLanguageFromText(text)

    if (clientDetectedLang !== "en") {
      return { language: clientDetectedLang, method: "client" }
    }

    // If client detection returns English or fails, use the API
    // Limit text length for detection to avoid token limits
    const truncatedText = text.length > 500 ? text.substring(0, 500) : text

    // Make a direct fetch request to OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a language detection system. Respond with only the ISO 639-1 language code.",
          },
          {
            role: "user",
            content: `Detect the language of the following text and return only the ISO 639-1 language code.
If you're unsure, return "en" as the default.

Text: "${truncatedText}"

Return only the language code without any additional text, explanation, or punctuation.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      }),
    })

    // Check if OpenAI response is OK
    if (!openaiResponse.ok) {
      return { language: clientDetectedLang, method: "client-fallback" }
    }

    // Parse OpenAI response
    const openaiData = await openaiResponse.json()
    const detectedLanguage = openaiData.choices[0]?.message?.content?.trim() || "en"

    // Clean up the response - remove any non-alphanumeric characters
    const cleanedCode = detectedLanguage
      .trim()
      .toLowerCase()
      .replace(/[^a-z-]/g, "")

    return {
      language: cleanedCode || "en", // Default to English if not found
      confidence: "high",
      method: "ai",
    }
  } catch (error) {
    // Return client-side detection as fallback
    return { language: detectLanguageFromText(text), method: "client-fallback" }
  }
}
