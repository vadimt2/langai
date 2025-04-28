// This is a simple fallback language detection utility
// It's not meant to be comprehensive, just a basic fallback

// Character sets that are distinctive for certain languages
const languagePatterns = [
  { pattern: /[\u0400-\u04FF]/, code: "ru" }, // Cyrillic (Russian)
  { pattern: /[\u0600-\u06FF]/, code: "ar" }, // Arabic
  { pattern: /[\u0900-\u097F]/, code: "hi" }, // Devanagari (Hindi)
  { pattern: /[\u0980-\u09FF]/, code: "bn" }, // Bengali
  { pattern: /[\u0A80-\u0AFF]/, code: "gu" }, // Gujarati
  { pattern: /[\u0B00-\u0B7F]/, code: "or" }, // Oriya
  { pattern: /[\u0B80-\u0BFF]/, code: "ta" }, // Tamil
  { pattern: /[\u0C00-\u0C7F]/, code: "te" }, // Telugu
  { pattern: /[\u0C80-\u0CFF]/, code: "kn" }, // Kannada
  { pattern: /[\u0D00-\u0D7F]/, code: "ml" }, // Malayalam
  { pattern: /[\u0E00-\u0E7F]/, code: "th" }, // Thai
  { pattern: /[\u0E80-\u0EFF]/, code: "lo" }, // Lao
  { pattern: /[\u1000-\u109F]/, code: "my" }, // Myanmar
  { pattern: /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/, code: "ko" }, // Korean
  { pattern: /[\u3040-\u309F\u30A0-\u30FF]/, code: "ja" }, // Japanese
  { pattern: /[\u4E00-\u9FFF]/, code: "zh" }, // Chinese
]

export function detectLanguageFromText(text: string): string {
  // Default to English
  if (!text || text.trim().length === 0) {
    return "en"
  }

  // Check for distinctive character sets
  for (const { pattern, code } of languagePatterns) {
    if (pattern.test(text)) {
      return code
    }
  }

  // If no distinctive characters found, default to English
  return "en"
}
