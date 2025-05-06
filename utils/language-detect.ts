import { franc, francAll } from 'franc';

// Mapping between our language codes and franc's language codes
const langCodeMap: Record<string, string[]> = {
  en: ['eng'],
  ru: ['rus'],
  zh: ['cmn', 'zho'],
  ja: ['jpn'],
  ko: ['kor'],
  ar: ['arb', 'ara'],
  de: ['deu', 'ger'],
  es: ['spa'],
  fr: ['fra', 'fre'],
  it: ['ita'],
  pt: ['por'],
  nl: ['nld', 'dut'],
  hi: ['hin'],
  tr: ['tur'],
  pl: ['pol'],
  uk: ['ukr'],
  vi: ['vie'],
  th: ['tha'],
  el: ['ell', 'gre'],
  he: ['heb'],
  cs: ['ces', 'cze'],
  da: ['dan'],
  fi: ['fin'],
  hu: ['hun'],
  id: ['ind'],
  no: ['nor'],
  sv: ['swe'],
  ro: ['ron', 'rum'],
  sk: ['slk', 'slo'],
};

/**
 * Checks if the detected language matches the expected language
 *
 * @param text Text to analyze
 * @param expectedLangCode The expected language code
 * @param minLength Minimum text length to analyze (defaults to 10)
 * @returns Object with detection results
 */
export function detectLanguageMismatch(
  text: string,
  expectedLangCode: string,
  minLength = 10
) {
  // Skip short texts
  if (!text || text.length < minLength) {
    return {
      isMismatch: false,
      detectedLang: 'und',
      confidence: 0,
      isReliable: false,
    };
  }

  try {
    // Get the top 3 language matches with confidence scores
    const detections = francAll(text, { minLength, only: [] });
    const [topMatch] = detections;

    // If no reliable match found
    if (!topMatch || topMatch[0] === 'und') {
      return {
        isMismatch: false,
        detectedLang: 'und',
        confidence: 0,
        isReliable: false,
      };
    }

    const [detectedLang, confidence] = topMatch;

    // Get the acceptable codes for the expected language
    const acceptableCodes = langCodeMap[expectedLangCode] || [expectedLangCode];

    // Check if detected language is acceptable
    const isAcceptable = acceptableCodes.includes(detectedLang);

    // Higher threshold for reliable detection
    const isReliable = confidence > 0.6;

    // Check for mismatch - detected English when expecting non-English
    const isEnglishMismatch =
      expectedLangCode !== 'en' && detectedLang === 'eng' && confidence > 0.5;

    // Check for any mismatch with good confidence
    const isOtherMismatch = !isAcceptable && confidence > 0.65;

    return {
      isMismatch: isEnglishMismatch || isOtherMismatch,
      detectedLang,
      confidence,
      isReliable,
      expectedLang: expectedLangCode,
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return {
      isMismatch: false,
      detectedLang: 'und',
      confidence: 0,
      isReliable: false,
      error,
    };
  }
}

/**
 * Get human-readable language name from franc language code
 */
export function getFrancLanguageName(francCode: string): string {
  const languageNames: Record<string, string> = {
    eng: 'English',
    rus: 'Russian',
    cmn: 'Chinese',
    zho: 'Chinese',
    jpn: 'Japanese',
    kor: 'Korean',
    arb: 'Arabic',
    ara: 'Arabic',
    deu: 'German',
    ger: 'German',
    spa: 'Spanish',
    fra: 'French',
    fre: 'French',
    ita: 'Italian',
    por: 'Portuguese',
    nld: 'Dutch',
    dut: 'Dutch',
    hin: 'Hindi',
    tur: 'Turkish',
    pol: 'Polish',
    ukr: 'Ukrainian',
    vie: 'Vietnamese',
    tha: 'Thai',
    ell: 'Greek',
    gre: 'Greek',
    heb: 'Hebrew',
    ces: 'Czech',
    cze: 'Czech',
    dan: 'Danish',
    fin: 'Finnish',
    hun: 'Hungarian',
    ind: 'Indonesian',
    nor: 'Norwegian',
    swe: 'Swedish',
    ron: 'Romanian',
    rum: 'Romanian',
    slk: 'Slovak',
    slo: 'Slovak',
    und: 'Unknown',
  };

  return languageNames[francCode] || francCode;
}
