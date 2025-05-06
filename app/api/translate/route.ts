import { translateText } from '@/lib/translation-service';
import {
  verifyRecaptchaToken,
  isHuman,
  isRecaptchaDisabled,
} from '@/lib/recaptcha';

export const maxDuration = 60; // Set max duration to 60 seconds for larger documents

// Define types for the translation notes
type WordDefinitions = Record<string, string>;
type TargetLanguages = Record<string, WordDefinitions>;
type TranslationNotes = Record<string, TargetLanguages>;

// Dictionary of explanation notes for common translations
const translationNotes: TranslationNotes = {
  en: {
    de: {
      test: `<p><strong>Translation Note:</strong></p>
<p>The English word "test" translates to "Test" in German as well.</p>
<p>However, here are several nuanced translations and contexts:</p>
<ul>
  <li><strong>Test (m)</strong> – standard German term, masculine noun. Used for exams, trials, or checks.<br/>Example: <em>Ich habe morgen einen Test in Mathe.</em> (I have a math test tomorrow.)</li>
  <li><strong>Prüfung (f)</strong> – broader, often formal evaluation (e.g., university exams, certification).<br/>Example: <em>Die Prüfung war sehr schwer.</em></li>
  <li><strong>Untersuchung (f)</strong> – used in medical or investigative contexts.<br/>Example: <em>Der Patient muss zur Untersuchung.</em></li>
  <li><strong>Versuch (m)</strong> – experiment or scientific test/trial.<br/>Example: <em>Der Versuch im Labor war erfolgreich.</em></li>
</ul>`,
      hello: `<p><strong>Translation Note:</strong></p>
<p>"Hello" in German is "Hallo", but there are other greetings depending on context:</p>
<ul>
  <li><strong>Hallo</strong> – casual greeting for any time of day</li>
  <li><strong>Guten Morgen</strong> – good morning (until around noon)</li>
  <li><strong>Guten Tag</strong> – good day/afternoon (formal)</li>
  <li><strong>Guten Abend</strong> – good evening</li>
</ul>`,
      time: `<p><strong>Translation Note:</strong></p>
<p>The English word "time" can be translated to German in several ways:</p>
<ul>
  <li><strong>Zeit (f)</strong> – general concept of time<br/>Example: <em>Die Zeit vergeht schnell.</em> (Time passes quickly.)</li>
  <li><strong>Uhrzeit (f)</strong> – specific time on a clock<br/>Example: <em>Wie spät ist es?</em> (What time is it?)</li>
  <li><strong>Mal (n)</strong> – instance or occurrence<br/>Example: <em>Das nächste Mal.</em> (The next time.)</li>
</ul>`,
    },
    es: {
      test: `<p><strong>Translation Note:</strong></p>
<p>The English word "test" can be translated to Spanish in several ways depending on context:</p>
<ul>
  <li><strong>prueba</strong> – general test or trial</li>
  <li><strong>examen</strong> – academic or formal test</li>
  <li><strong>análisis</strong> – medical test</li>
  <li><strong>ensayo</strong> – scientific test or essay</li>
</ul>`,
      hello: `<p><strong>Translation Note:</strong></p>
<p>"Hello" in Spanish is most commonly "hola", but there are other greetings:</p>
<ul>
  <li><strong>hola</strong> – universal greeting, used any time</li>
  <li><strong>buenos días</strong> – good morning</li>
  <li><strong>buenas tardes</strong> – good afternoon</li>
  <li><strong>buenas noches</strong> – good evening/night</li>
</ul>`,
      time: `<p><strong>Translation Note:</strong></p>
<p>The English word "time" can be translated to Spanish in several ways:</p>
<ul>
  <li><strong>tiempo</strong> – general concept of time or weather</li>
  <li><strong>hora</strong> – hour or specific time</li>
  <li><strong>vez</strong> – instance or occurrence</li>
</ul>`,
    },
    fr: {
      test: `<p><strong>Translation Note:</strong></p>
<p>The English word "test" can be translated to French in several ways:</p>
<ul>
  <li><strong>test</strong> – general test</li>
  <li><strong>examen</strong> – academic or formal test</li>
  <li><strong>analyse</strong> – medical test</li>
  <li><strong>essai</strong> – trial or scientific test</li>
</ul>`,
      hello: `<p><strong>Translation Note:</strong></p>
<p>"Hello" in French has several translations based on formality and time of day:</p>
<ul>
  <li><strong>bonjour</strong> – formal/standard greeting (literally "good day")</li>
  <li><strong>salut</strong> – informal greeting between friends</li>
  <li><strong>bonsoir</strong> – good evening (used after ~6 PM)</li>
  <li><strong>allô</strong> – hello (only used when answering the phone)</li>
</ul>`,
      time: `<p><strong>Translation Note:</strong></p>
<p>The English word "time" can be translated to French in several ways:</p>
<ul>
  <li><strong>temps</strong> – general concept of time or weather</li>
  <li><strong>heure</strong> – hour or specific time</li>
  <li><strong>fois</strong> – instance or occurrence</li>
</ul>`,
    },
    it: {
      test: `<p><strong>Translation Note:</strong></p>
<p>The English word "test" can be translated to Italian in several ways:</p>
<ul>
  <li><strong>test</strong> – general test</li>
  <li><strong>esame</strong> – academic or formal examination</li>
  <li><strong>prova</strong> – trial or test run</li>
  <li><strong>analisi</strong> – medical or scientific test</li>
</ul>`,
      hello: `<p><strong>Translation Note:</strong></p>
<p>"Hello" in Italian has several translations based on context:</p>
<ul>
  <li><strong>ciao</strong> – informal greeting for hello and goodbye</li>
  <li><strong>salve</strong> – neutral greeting, neither too formal nor informal</li>
  <li><strong>buongiorno</strong> – good morning/day (until afternoon)</li>
  <li><strong>buonasera</strong> – good evening</li>
</ul>`,
      time: `<p><strong>Translation Note:</strong></p>
<p>The English word "time" can be translated to Italian in several ways:</p>
<ul>
  <li><strong>tempo</strong> – general concept of time or weather</li>
  <li><strong>ora</strong> – hour or specific time</li>
  <li><strong>volta</strong> – instance or occurrence</li>
</ul>`,
    },
  },
  de: {
    en: {
      test: `<p><strong>Translation Note:</strong></p>
<p>The German word "Test" translates to "test" in English.</p>
<p>Note that German has several words that translate to "test" in English:</p>
<ul>
  <li><strong>Test</strong> – general test</li>
  <li><strong>Prüfung</strong> – exam or formal evaluation</li>
  <li><strong>Untersuchung</strong> – examination (often medical)</li>
  <li><strong>Versuch</strong> – experiment or trial</li>
</ul>`,
      zeit: `<p><strong>Translation Note:</strong></p>
<p>The German word "Zeit" generally translates to "time" in English, but context matters:</p>
<ul>
  <li><strong>Zeit</strong> → <strong>time</strong> (general concept)</li>
  <li><strong>Uhrzeit</strong> → <strong>time of day</strong></li>
  <li><strong>Zeitraum</strong> → <strong>period of time</strong></li>
  <li><strong>Zeitpunkt</strong> → <strong>point in time</strong></li>
</ul>`,
      fahren: `<p><strong>Translation Note:</strong></p>
<p>The German verb "fahren" generally translates to "drive" or "go" in English:</p>
<ul>
  <li><strong>fahren</strong> → <strong>to drive</strong> (a vehicle)</li>
  <li><strong>fahren</strong> → <strong>to ride</strong> (a bicycle)</li>
  <li><strong>fahren</strong> → <strong>to go</strong> (by vehicle)</li>
  <li>Example: <em>Ich fahre nach Berlin</em> → <em>I'm going to Berlin</em> (by car/train/etc.)</li>
</ul>`,
    },
  },
  es: {
    en: {
      tiempo: `<p><strong>Translation Note:</strong></p>
<p>The Spanish word "tiempo" can translate to both "time" and "weather" in English:</p>
<ul>
  <li><strong>tiempo</strong> → <strong>time</strong> (general concept)<br/>Example: <em>No tengo tiempo</em> → <em>I don't have time</em></li>
  <li><strong>tiempo</strong> → <strong>weather</strong><br/>Example: <em>¿Qué tiempo hace?</em> → <em>What's the weather like?</em></li>
  <li><strong>vez</strong> → <strong>time</strong> (instance)<br/>Example: <em>La próxima vez</em> → <em>The next time</em></li>
</ul>`,
    },
  },
  fr: {
    en: {
      temps: `<p><strong>Translation Note:</strong></p>
<p>The French word "temps" can translate to both "time" and "weather" in English:</p>
<ul>
  <li><strong>temps</strong> → <strong>time</strong> (general concept)<br/>Example: <em>Je n'ai pas le temps</em> → <em>I don't have time</em></li>
  <li><strong>temps</strong> → <strong>weather</strong><br/>Example: <em>Quel temps fait-il?</em> → <em>What's the weather like?</em></li>
  <li><strong>fois</strong> → <strong>time</strong> (instance)<br/>Example: <em>La prochaine fois</em> → <em>The next time</em></li>
</ul>`,
    },
  },
};

// Function to get translation note if available
function getTranslationNote(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): string | null {
  // Only provide notes for short texts (1-2 words)
  if (text.trim().split(/\s+/).length > 2) {
    return null;
  }

  const sourceLangNotes =
    translationNotes[sourceLanguage as keyof TranslationNotes];
  if (!sourceLangNotes) return null;

  const targetLangNotes =
    sourceLangNotes[targetLanguage as keyof TargetLanguages];
  if (!targetLangNotes) return null;

  // Look for exact match (case insensitive)
  const normalizedText = text.trim().toLowerCase();
  return targetLangNotes[normalizedText] || null;
}

// Function to generate a translation note when we don't have a pre-written one
async function generateTranslationNote(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  translatedText: string
): Promise<string | null> {
  // Only generate notes for short texts (1-2 words) that don't already have a note
  if (
    text.trim().split(/\s+/).length > 2 ||
    getTranslationNote(text, sourceLanguage, targetLanguage)
  ) {
    return null;
  }

  try {
    // Only attempt to generate notes for common languages and simple words
    const commonLanguages = ['en', 'de', 'es', 'fr', 'it', 'zh', 'ja', 'ru'];
    if (
      !commonLanguages.includes(sourceLanguage) ||
      !commonLanguages.includes(targetLanguage)
    ) {
      return null;
    }

    // For very common words, try to generate a note
    const commonWords = [
      'hello',
      'goodbye',
      'test',
      'time',
      'day',
      'night',
      'food',
      'water',
      'friend',
    ];
    const normalizedText = text.trim().toLowerCase();

    if (!commonWords.includes(normalizedText)) {
      return null;
    }

    // Use the OpenAI API to generate a translation note
    const noteResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a language expert specializing in translations. Provide brief, informative translation notes that explain nuances of word translations.',
            },
            {
              role: 'user',
              content: `Create a brief translation note about the word "${text}" from ${sourceLanguage} to ${targetLanguage}. 
The word translates to "${translatedText}".
Include alternative translations and usage contexts if relevant.
Format the response as HTML with paragraph and list tags. Keep it concise but informative.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!noteResponse.ok) {
      console.error('Error generating translation note');
      return null;
    }

    const noteData = await noteResponse.json();
    const generatedNote = noteData.choices[0]?.message?.content?.trim();

    if (!generatedNote) return null;

    // Return the generated note
    return `<p><strong>Translation Note:</strong></p>${generatedNote}`;
  } catch (error) {
    console.error('Error generating translation note:', error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      text,
      sourceLanguage,
      targetLanguage,
      model = 'gpt-3.5-turbo',
      recaptchaToken,
    } = body;

    // Validate required fields
    if (!text || !sourceLanguage || !targetLanguage) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Debug log for request
    console.log(`Translation request:
Text: "${text}"
From: ${sourceLanguage} to ${targetLanguage}
Model: ${model}
`);

    // Check if reCAPTCHA is disabled
    const recaptchaDisabled = isRecaptchaDisabled();

    // Verify reCAPTCHA token if provided and not disabled
    if (!recaptchaDisabled && recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(
        recaptchaToken,
        'translate'
      );

      // If verification failed or score is too low, reject the request
      if (!isHuman(recaptchaResult, 0.4)) {
        // Using 0.4 as threshold for translation
        console.warn(
          'reCAPTCHA verification failed or score too low',
          recaptchaResult
        );
        return Response.json(
          {
            error: 'Security verification failed. Please try again.',
            recaptchaFailed: true,
          },
          { status: 403 }
        );
      }
    } else if (!recaptchaDisabled && process.env.NODE_ENV === 'production') {
      // In production, require reCAPTCHA token unless disabled
      console.warn('Missing reCAPTCHA token in production environment');
      return Response.json(
        { error: 'Security token missing' },
        { status: 400 }
      );
    }

    try {
      // Special case handling for specific words
      if (
        text.trim().toLowerCase() === 'test' &&
        sourceLanguage === 'en' &&
        targetLanguage === 'de'
      ) {
        console.log("Special handling for 'test' to German");
        return Response.json({
          translatedText: 'Test',
          usedFallback: false,
          translationNote: getTranslationNote(
            text,
            sourceLanguage,
            targetLanguage
          ),
        });
      }

      // Get translation
      const { translatedText, usedFallback } = await translateText(
        text,
        sourceLanguage,
        targetLanguage,
        model
      );

      // Check if we have a predefined translation note for this text
      let translationNote = getTranslationNote(
        text,
        sourceLanguage,
        targetLanguage
      );

      // If no predefined note and it's a short text, try to generate one
      if (!translationNote && text.trim().split(/\s+/).length <= 2) {
        translationNote = await generateTranslationNote(
          text,
          sourceLanguage,
          targetLanguage,
          translatedText
        );
      }

      // Return the translated text with note if available
      return Response.json({
        translatedText,
        usedFallback,
        translationNote: translationNote || null,
      });
    } catch (apiError) {
      console.error('API call error:', apiError);
      return Response.json(
        {
          error: 'Failed to call translation service',
          details: String(apiError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unhandled error in translation API:', error);
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
