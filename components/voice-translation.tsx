'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic,
  Square,
  Volume2,
  Loader2,
  Save,
  Clock,
  Languages,
  InfoIcon,
  Copy,
  VolumeIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHistory } from '@/context/history-context';
import { useMobile } from '@/hooks/use-mobile';
import { useRecaptchaContext } from '@/context/recaptcha-context';
import { Progress } from '@/components/ui/progress';
import { getLanguageByCode } from '@/data/languages';
import {
  detectLanguageMismatch,
  getFrancLanguageName,
} from '@/utils/language-detect';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VoiceTranslationProps {
  sourceLanguage: string;
  targetLanguage: string;
  model?: string;
}

// Maximum recording time in seconds (4 minutes)
const MAX_RECORDING_TIME = 240;

// Declare SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Create async function for translation
async function translateText({
  text,
  sourceLanguage,
  targetLanguage,
  model,
}: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
}) {
  if (!text.trim()) {
    throw new Error('No text to translate');
  }

  // Create an AbortController to handle timeouts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
        model,
      }),
      signal: controller.signal, // Add the abort signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.error || `HTTP error! status: ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Translation request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId); // Clear the timeout
  }
}

export default function VoiceTranslation({
  sourceLanguage,
  targetLanguage,
  model = 'gpt-3.5-turbo',
}: VoiceTranslationProps) {
  // Basic state variables
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // Form state (simulating useFormState)
  const [manualInputText, setManualInputText] = useState('');

  // Translation state (simulating useActionState)
  const [translation, setTranslation] = useState('');
  const [translationNote, setTranslationNote] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<Error | null>(null);

  // UI state (simulating useOptimistic)
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const { addToHistory } = useHistory();
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useMobile();
  const {
    getToken,
    isLoaded: recaptchaLoaded,
    isDisabled,
  } = useRecaptchaContext();
  const [languageIndicator, setLanguageIndicator] = useState<string>('');

  // Detect Android specifically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAndroid(/Android/i.test(navigator.userAgent));
    }
  }, []);

  // Implement exact language code mapping as suggested by ChatGPT
  const getLanguageCode = (langCode: string): string => {
    // Direct mapping of language codes to BCP-47 format for all supported languages
    const exactCodes: Record<string, string> = {
      // Common languages
      en: 'en-US', // English (US)
      es: 'es-ES', // Spanish
      fr: 'fr-FR', // French
      de: 'de-DE', // German
      it: 'it-IT', // Italian
      pt: 'pt-BR', // Portuguese (Brazil)
      ru: 'ru-RU', // Russian
      zh: 'zh-CN', // Chinese (Simplified)
      ja: 'ja-JP', // Japanese
      ko: 'ko-KR', // Korean
      ar: 'ar-SA', // Arabic
      hi: 'hi-IN', // Hindi

      // All other supported languages alphabetically
      ab: 'ab', // Abkhaz (no specific regional code)
      aa: 'aa', // Afar
      af: 'af-ZA', // Afrikaans
      ak: 'ak-GH', // Akan
      sq: 'sq-AL', // Albanian
      am: 'am-ET', // Amharic
      an: 'an', // Aragonese
      hy: 'hy-AM', // Armenian
      as: 'as-IN', // Assamese
      av: 'av', // Avaric
      ae: 'ae', // Avestan
      ay: 'ay-BO', // Aymara
      az: 'az-AZ', // Azerbaijani
      bm: 'bm-ML', // Bambara
      ba: 'ba', // Bashkir
      eu: 'eu-ES', // Basque
      be: 'be-BY', // Belarusian
      bn: 'bn-BD', // Bengali
      bh: 'bh', // Bihari
      bi: 'bi-VU', // Bislama
      bs: 'bs-BA', // Bosnian
      br: 'br-FR', // Breton
      bg: 'bg-BG', // Bulgarian
      my: 'my-MM', // Burmese
      ca: 'ca-ES', // Catalan
      ch: 'ch-GU', // Chamorro
      ce: 'ce', // Chechen
      ny: 'ny-MW', // Chichewa
      cv: 'cv', // Chuvash
      kw: 'kw-GB', // Cornish
      co: 'co-FR', // Corsican
      cr: 'cr-CA', // Cree
      hr: 'hr-HR', // Croatian
      cs: 'cs-CZ', // Czech
      da: 'da-DK', // Danish
      dv: 'dv-MV', // Divehi
      nl: 'nl-NL', // Dutch
      dz: 'dz-BT', // Dzongkha
      eo: 'eo', // Esperanto
      et: 'et-EE', // Estonian
      ee: 'ee-GH', // Ewe
      fo: 'fo-FO', // Faroese
      fj: 'fj-FJ', // Fijian
      fi: 'fi-FI', // Finnish
      ff: 'ff', // Fula
      gl: 'gl-ES', // Galician
      ka: 'ka-GE', // Georgian
      el: 'el-GR', // Greek
      gn: 'gn-PY', // Guaraní
      gu: 'gu-IN', // Gujarati
      ht: 'ht-HT', // Haitian
      ha: 'ha-NG', // Hausa
      he: 'he-IL', // Hebrew
      hz: 'hz', // Herero
      ho: 'ho', // Hiri Motu
      hu: 'hu-HU', // Hungarian
      ia: 'ia', // Interlingua
      id: 'id-ID', // Indonesian
      ie: 'ie', // Interlingue
      ga: 'ga-IE', // Irish
      ig: 'ig-NG', // Igbo
      ik: 'ik', // Inupiaq
      io: 'io', // Ido
      is: 'is-IS', // Icelandic
      iu: 'iu-CA', // Inuktitut
      jv: 'jv-ID', // Javanese
      kl: 'kl-GL', // Kalaallisut
      kn: 'kn-IN', // Kannada
      kr: 'kr', // Kanuri
      ks: 'ks-IN', // Kashmiri
      kk: 'kk-KZ', // Kazakh
      km: 'km-KH', // Khmer
      ki: 'ki-KE', // Kikuyu
      rw: 'rw-RW', // Kinyarwanda
      ky: 'ky-KG', // Kyrgyz
      kv: 'kv', // Komi
      kg: 'kg-CD', // Kongo
      ku: 'ku-IQ', // Kurdish
      kj: 'kj', // Kwanyama
      la: 'la-VA', // Latin
      lb: 'lb-LU', // Luxembourgish
      lg: 'lg-UG', // Luganda
      li: 'li-NL', // Limburgish
      ln: 'ln-CD', // Lingala
      lo: 'lo-LA', // Lao
      lt: 'lt-LT', // Lithuanian
      lu: 'lu-CD', // Luba-Katanga
      lv: 'lv-LV', // Latvian
      gv: 'gv-IM', // Manx
      mk: 'mk-MK', // Macedonian
      mg: 'mg-MG', // Malagasy
      ms: 'ms-MY', // Malay
      ml: 'ml-IN', // Malayalam
      mt: 'mt-MT', // Maltese
      mi: 'mi-NZ', // Māori
      mr: 'mr-IN', // Marathi
      mh: 'mh-MH', // Marshallese
      mn: 'mn-MN', // Mongolian
      na: 'na-NR', // Nauru
      nv: 'nv', // Navajo
      nd: 'nd-ZW', // North Ndebele
      ne: 'ne-NP', // Nepali
      ng: 'ng', // Ndonga
      nb: 'nb-NO', // Norwegian Bokmål
      nn: 'nn-NO', // Norwegian Nynorsk
      no: 'no-NO', // Norwegian
      ii: 'ii-CN', // Nuosu
      nr: 'nr-ZA', // South Ndebele
      oc: 'oc-FR', // Occitan
      oj: 'oj-CA', // Ojibwe
      cu: 'cu', // Old Church Slavonic
      om: 'om-ET', // Oromo
      or: 'or-IN', // Oriya
      os: 'os-GE', // Ossetian
      pa: 'pa-IN', // Panjabi
      pi: 'pi', // Pāli
      fa: 'fa-IR', // Persian
      pl: 'pl-PL', // Polish
      ps: 'ps-AF', // Pashto
      qu: 'qu-PE', // Quechua
      rm: 'rm-CH', // Romansh
      rn: 'rn-BI', // Kirundi
      ro: 'ro-RO', // Romanian
      sa: 'sa-IN', // Sanskrit
      sc: 'sc-IT', // Sardinian
      sd: 'sd-PK', // Sindhi
      se: 'se-NO', // Northern Sami
      sm: 'sm-WS', // Samoan
      sg: 'sg-CF', // Sango
      sr: 'sr-RS', // Serbian
      gd: 'gd-GB', // Scottish Gaelic
      sn: 'sn-ZW', // Shona
      si: 'si-LK', // Sinhala
      sk: 'sk-SK', // Slovak
      sl: 'sl-SI', // Slovene
      so: 'so-SO', // Somali
      st: 'st-ZA', // Southern Sotho
      su: 'su-ID', // Sundanese
      sw: 'sw-TZ', // Swahili
      ss: 'ss-SZ', // Swati
      sv: 'sv-SE', // Swedish
      ta: 'ta-IN', // Tamil
      te: 'te-IN', // Telugu
      tg: 'tg-TJ', // Tajik
      th: 'th-TH', // Thai
      ti: 'ti-ER', // Tigrinya
      bo: 'bo-CN', // Tibetan
      tk: 'tk-TM', // Turkmen
      tl: 'tl-PH', // Tagalog
      tn: 'tn-BW', // Tswana
      to: 'to-TO', // Tonga
      tr: 'tr-TR', // Turkish
      ts: 'ts-ZA', // Tsonga
      tt: 'tt-RU', // Tatar
      tw: 'tw-GH', // Twi
      ty: 'ty-PF', // Tahitian
      ug: 'ug-CN', // Uighur
      uk: 'uk-UA', // Ukrainian
      ur: 'ur-PK', // Urdu
      uz: 'uz-UZ', // Uzbek
    };

    return exactCodes[langCode] || langCode;
  };

  // Improve the Android speech recognition implementation
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      // Create new instance to ensure clean state
      const recognition = new SpeechRecognition();

      // Configure the recognition object - different settings for Android
      if (isAndroid) {
        recognition.continuous = false; // Use single results for Android (more reliable)
        recognition.interimResults = false; // No interim results on Android
        recognition.maxAlternatives = 1;
      } else {
        recognition.continuous = true;
        recognition.interimResults = true;
      }

      // Set the exact BCP-47 language code (critical for Android)
      const exactLanguageCode = getLanguageCode(sourceLanguage);
      recognition.lang = exactLanguageCode;

      console.log(
        `Setting speech recognition language to: ${exactLanguageCode}`
      );

      recognition.onresult = (event: any) => {
        let transcript = '';
        const resultIndex = event.resultIndex || 0;

        for (let i = resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }

        const finalText = transcript.trim();

        // For Android, accumulate text instead of replacing
        if (finalText) {
          if (isAndroid) {
            setRecordedText((prev) => {
              if (!prev) return finalText;
              return prev + ' ' + finalText;
            });

            // For Android, restart recognition to continue
            try {
              if (isRecording) {
                recognition.stop();
                setTimeout(() => {
                  if (isRecording) {
                    recognition.start();
                  }
                }, 300);
              }
            } catch (e) {
              console.error('Error restarting Android recognition:', e);
            }
          } else {
            // Non-Android behavior
            setRecordedText(finalText);
          }
        }

        // Show processing UI for immediate feedback
        if (finalText.length > 0) {
          setIsProcessing(false); // Keep UI clean
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        // Don't show Android "no-speech" errors as we restart automatically
        if (!(isAndroid && event.error === 'no-speech')) {
          // Show error message
          toast({
            title: 'Recognition Error',
            description: `Error: ${event.error}. Please try again.`,
            variant: 'destructive',
          });
        }

        // For Android, try to restart on certain recoverable errors
        if (
          isAndroid &&
          isRecording &&
          ['network', 'aborted'].includes(event.error)
        ) {
          try {
            setTimeout(() => {
              if (isRecording) {
                recognition.start();
              }
            }, 300);
          } catch (e) {
            console.error('Failed to restart recognition after error');
            setIsRecording(false);
            stopTimer();
          }
        } else {
          setIsRecording(false);
          stopTimer();
        }
      };

      recognition.onend = () => {
        // On Android, if still recording, restart recognition for continuous experience
        if (isAndroid && isRecording) {
          try {
            setTimeout(() => {
              if (isRecording) {
                recognition.start();
              }
            }, 300);
          } catch (e) {
            console.error('Error restarting recognition:', e);
            setIsRecording(false);
            stopTimer();
          }
        } else if (!isAndroid) {
          // Standard behavior for desktop
          setIsRecording(false);
          stopTimer();
        }
      };

      // Store recognition object in ref
      recognitionRef.current = recognition;
    }

    return () => {
      // Clean up
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [sourceLanguage, isAndroid, isRecording, toast]);

  // Simplified recording function with best practices
  const startRecording = () => {
    // Clear previous data
    setRecordedText('');
    setTranslation('');
    setTranslationNote(null);
    setTranslationError(null);
    setIsProcessing(false);

    if (!recognitionRef.current) {
      toast({
        title: 'Speech Recognition Unavailable',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Always set the language right before starting
      const exactLanguageCode = getLanguageCode(sourceLanguage);
      recognitionRef.current.lang = exactLanguageCode;

      // Show which language we're using with platform-specific instructions
      toast({
        title: `Listening in ${
          getLanguageByCode(sourceLanguage)?.name || sourceLanguage
        }`,
        description: isAndroid
          ? `Speak in short phrases for better results. Using language code: ${exactLanguageCode}`
          : 'Speak clearly for best results',
        duration: 3000,
      });

      // For Android devices, provide language examples to help with recognition
      if (isAndroid) {
        // Show example phrases for the selected language to help user
        const examplePhrases = getExamplePhrases(sourceLanguage);
        if (examplePhrases) {
          setTimeout(() => {
            if (isRecording) {
              toast({
                title: 'Tip: Try these example phrases',
                description: examplePhrases,
                duration: 5000,
              });
            }
          }, 3500);
        }
      }

      // Start recognition
      recognitionRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: 'Recognition Error',
        description: 'Could not start speech recognition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to provide language-specific example phrases
  const getExamplePhrases = (langCode: string): string => {
    const examples: Record<string, string> = {
      en: "Try saying: 'Hello, how are you?' or 'What time is it?'",
      es: "Intenta decir: 'Hola, ¿cómo estás?' o '¿Qué hora es?'",
      fr: "Essayez de dire: 'Bonjour, comment allez-vous?' ou 'Quelle heure est-il?'",
      de: "Versuchen Sie zu sagen: 'Hallo, wie geht es Ihnen?' oder 'Wie spät ist es?'",
      ru: "Попробуйте сказать: 'Привет, как дела?' или 'Который час?'",
      zh: "试着说: '你好，你好吗？' 或 '现在几点了？'",
      ja: "試しに言ってみて: 'こんにちは、お元気ですか？' または '今何時ですか？'",
      it: "Prova a dire: 'Ciao, come stai?' o 'Che ore sono?'",
      pt: "Tente dizer: 'Olá, como você está?' ou 'Que horas são?'",
      ar: "حاول أن تقول: 'مرحبا، كيف حالك؟' أو 'كم الساعة؟'",
      hi: "कोशिश करें कहने की: 'नमस्ते, आप कैसे हैं?' या 'अभी क्या समय है?'",
      ko: "이렇게 말해보세요: '안녕하세요, 어떻게 지내세요?' 또는 '지금 몇 시예요?'",
    };

    return (
      examples[langCode] || 'Speak clearly in short phrases for best results'
    );
  };

  // Timer effect for recording time limit
  useEffect(() => {
    if (isRecording) {
      if (recordingTime >= MAX_RECORDING_TIME) {
        stopRecording();
        toast({
          title: 'Time Limit Reached',
          description:
            'The maximum recording time of 4 minutes has been reached.',
          variant: 'default',
        });
      }
    }
  }, [recordingTime, isRecording, toast]);

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    setIsRecording(false);
    stopTimer();
  };

  // Improved translation function with better error handling
  const handleTranslate = async () => {
    if (!recordedText.trim() || isTranslating || isDisabled) return;

    // Clear previous values and show loading state
    setTranslation('');
    setTranslationNote(null);
    setTranslationError(null);
    setIsTranslating(true);
    setIsProcessing(true);

    // User feedback about what's happening
    toast({
      title: 'Processing Translation',
      description: `Translating from ${
        getLanguageByCode(sourceLanguage)?.name || sourceLanguage
      } to ${getLanguageByCode(targetLanguage)?.name || targetLanguage}`,
      duration: 3000,
    });

    try {
      // Use the async function to handle translation
      const result = await translateText({
        text: recordedText,
        sourceLanguage,
        targetLanguage,
        model,
      });

      setTranslation(result.translatedText);

      // Set translation note if available
      if (result.translationNote) {
        setTranslationNote(result.translationNote);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(
        error instanceof Error ? error : new Error('Unknown error')
      );

      toast({
        title: 'Translation Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to translate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
      setIsProcessing(false);
    }
  };

  // For manual input submission
  const handleManualInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setManualInputText(e.target.value);
  };

  const handleManualSubmit = async () => {
    if (!manualInputText.trim() || isTranslating || isDisabled) return;

    setRecordedText(manualInputText);
    setIsProcessing(true);

    // Use the same translation function
    setTranslation('');
    setTranslationNote(null);
    setTranslationError(null);
    setIsTranslating(true);

    // User feedback about what's happening
    toast({
      title: 'Processing Translation',
      description: `Translating from ${
        getLanguageByCode(sourceLanguage)?.name || sourceLanguage
      } to ${getLanguageByCode(targetLanguage)?.name || targetLanguage}`,
      duration: 3000,
    });

    try {
      // Use the async function to handle translation
      const result = await translateText({
        text: manualInputText,
        sourceLanguage,
        targetLanguage,
        model,
      });

      setTranslation(result.translatedText);

      // Set translation note if available
      if (result.translationNote) {
        setTranslationNote(result.translationNote);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(
        error instanceof Error ? error : new Error('Unknown error')
      );

      toast({
        title: 'Translation Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to translate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
      setIsProcessing(false);
    }
  };

  const handleCopyTranslation = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
      toast({
        title: 'Copied',
        description: 'Translation copied to clipboard',
      });
    }
  };

  const handleTextToSpeech = () => {
    if (!translation || isSpeaking) return;

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = targetLanguage;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: 'Speech Error',
        description: 'Could not play the translation',
        variant: 'destructive',
      });
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (recordedText && translation) {
      addToHistory({
        sourceLanguage,
        targetLanguage,
        sourceText: recordedText,
        translatedText: translation,
        timestamp: new Date().toISOString(),
        mode: 'voice',
      });

      toast({
        title: 'Saved',
        description: 'Voice translation saved to history',
      });
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Updated render method with modern UI patterns
  return (
    <div className='space-y-4 mt-4'>
      <div className='flex flex-col items-center space-y-4'>
        <Button
          onClick={toggleRecording}
          variant={isRecording ? 'destructive' : 'default'}
          size='lg'
          className='rounded-full h-16 w-16 flex items-center justify-center'
        >
          {isRecording ? (
            <Square className='h-6 w-6' />
          ) : (
            <Mic className='h-6 w-6' />
          )}
          <span className='sr-only'>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </span>
        </Button>

        <p className='text-sm text-center font-medium'>
          {isRecording
            ? `Recording in ${
                getLanguageByCode(sourceLanguage)?.name || sourceLanguage
              }`
            : 'Press the microphone button to start recording'}
        </p>

        {/* Show the exact language code being used (helpful for debugging) */}
        {isRecording && isAndroid && (
          <div className='text-xs text-muted-foreground'>
            Using language code: {getLanguageCode(sourceLanguage)}
          </div>
        )}

        {isRecording && (
          <div className='w-full max-w-md space-y-2'>
            <div className='flex justify-between items-center'>
              <p className='text-sm font-medium'>Recording time:</p>
              <span className='text-sm tabular-nums'>
                {formatTime(recordingTime)}
              </span>
            </div>
            <Progress value={(recordingTime / MAX_RECORDING_TIME) * 100} />
          </div>
        )}

        {recordedText && (
          <div className='w-full max-w-md mt-4'>
            <div className='bg-background rounded-lg border p-4'>
              <p className='text-sm font-medium mb-2'>Recorded Text:</p>
              <p className='text-sm'>{recordedText}</p>
            </div>

            <div className='flex justify-center mt-4'>
              <Button
                onClick={handleTranslate}
                disabled={!recordedText.trim() || isTranslating || isDisabled}
                className='w-full sm:w-auto'
              >
                {isTranslating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Translating...
                  </>
                ) : (
                  'Translate'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Show manual input option for Android when needed */}
        {isAndroid &&
          !isRecording &&
          !recordedText &&
          sourceLanguage !== 'en' && (
            <div className='w-full max-w-md mt-4'>
              <div className='bg-muted rounded-lg p-4 text-center'>
                <p className='text-sm mb-2'>
                  Android has limited support for non-English speech
                  recognition.
                </p>
                <p className='text-xs text-muted-foreground mb-3'>
                  Try using the exact BCP-47 language code:{' '}
                  {getLanguageCode(sourceLanguage)}
                </p>
                <Textarea
                  value={manualInputText}
                  onChange={handleManualInputChange}
                  placeholder={`Type your text in ${
                    getLanguageByCode(sourceLanguage)?.name || sourceLanguage
                  }...`}
                  className='min-h-[80px] mb-3'
                />
                <Button
                  onClick={handleManualSubmit}
                  disabled={
                    !manualInputText.trim() || isTranslating || isDisabled
                  }
                  className='w-full'
                >
                  Translate
                </Button>
              </div>
            </div>
          )}

        {translation && (
          <div className='w-full max-w-md mt-4'>
            <div className='bg-secondary rounded-lg p-4'>
              <div className='flex justify-between items-center mb-2'>
                <p className='text-sm font-medium'>Translation:</p>
                <div className='flex items-center space-x-2'>
                  <Button
                    onClick={handleCopyTranslation}
                    size='sm'
                    variant='ghost'
                    className='h-8 w-8 p-0'
                  >
                    <Copy className='h-4 w-4' />
                    <span className='sr-only'>Copy translation</span>
                  </Button>
                  <Button
                    onClick={handleTextToSpeech}
                    size='sm'
                    variant='ghost'
                    className='h-8 w-8 p-0'
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Volume2 className='h-4 w-4' />
                    )}
                    <span className='sr-only'>
                      {isSpeaking ? 'Speaking...' : 'Speak translation'}
                    </span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    size='sm'
                    variant='ghost'
                    className='h-8 w-8 p-0'
                  >
                    <Save className='h-4 w-4' />
                    <span className='sr-only'>Save translation</span>
                  </Button>
                </div>
              </div>
              <p className='text-sm'>{translation}</p>

              {/* Display translation note if available */}
              {translationNote && (
                <div className='mt-3 text-xs p-2 bg-muted/50 rounded border'>
                  <p className='font-medium mb-1'>Translation note:</p>
                  <p>{translationNote}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show error message if translation fails */}
        {translationError && (
          <div className='w-full max-w-md mt-4'>
            <div className='bg-destructive/10 rounded-lg p-4 text-destructive'>
              <p className='font-medium'>Translation Error</p>
              <p className='text-sm mt-1'>{translationError.message}</p>
            </div>
          </div>
        )}

        {/* Show loading indicator while processing */}
        {isProcessing &&
          !isTranslating &&
          !translation &&
          !translationError && (
            <div className='w-full max-w-md mt-4 flex justify-center'>
              <div className='flex items-center space-x-2'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
                <p className='text-sm'>Processing language...</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
