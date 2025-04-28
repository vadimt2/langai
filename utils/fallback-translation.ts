// A simple dictionary-based translation fallback for common phrases
// This is just a basic implementation for demonstration purposes
// In a real app, you would use a more comprehensive solution

type TranslationDictionary = {
  [key: string]: {
    [targetLang: string]: string
  }
}

// Very limited dictionary for demonstration
const commonPhrases: TranslationDictionary = {
  hello: {
    es: "hola",
    fr: "bonjour",
    de: "hallo",
    it: "ciao",
    pt: "olá",
    ru: "привет",
    zh: "你好",
    ja: "こんにちは",
  },
  goodbye: {
    es: "adiós",
    fr: "au revoir",
    de: "auf wiedersehen",
    it: "arrivederci",
    pt: "adeus",
    ru: "до свидания",
    zh: "再见",
    ja: "さようなら",
  },
  "thank you": {
    es: "gracias",
    fr: "merci",
    de: "danke",
    it: "grazie",
    pt: "obrigado",
    ru: "спасибо",
    zh: "谢谢",
    ja: "ありがとう",
  },
  // Add more common phrases as needed
}

/**
 * A very basic fallback translation function
 * This is not meant to be comprehensive, just a fallback when the main service fails
 */
export function fallbackTranslate(text: string, sourceLang: string, targetLang: string): string {
  // If source and target are the same, return the original text
  if (sourceLang === targetLang) {
    return text
  }

  // If the target language is English, we don't have a reverse dictionary
  // so just return the original text with a note
  if (targetLang === "en") {
    return `[Fallback translation] ${text}`
  }

  // For simplicity, we'll only handle English to other languages
  if (sourceLang !== "en") {
    return `[Unsupported fallback translation] ${text}`
  }

  // Convert text to lowercase for dictionary lookup
  const lowerText = text.toLowerCase()

  // Check if the exact text is in our dictionary
  if (commonPhrases[lowerText] && commonPhrases[lowerText][targetLang]) {
    return commonPhrases[lowerText][targetLang]
  }

  // For longer text, try to replace known phrases
  let translatedText = text
  Object.keys(commonPhrases).forEach((phrase) => {
    if (commonPhrases[phrase][targetLang]) {
      // Use case-insensitive replacement
      const regex = new RegExp(phrase, "gi")
      translatedText = translatedText.replace(regex, commonPhrases[phrase][targetLang])
    }
  })

  // If we made any replacements, return the result
  if (translatedText !== text) {
    return translatedText
  }

  // If all else fails, return the original text with a note
  return `[Fallback could not translate] ${text}`
}
