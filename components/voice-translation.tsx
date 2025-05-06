'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Mic,
  Square,
  Play,
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

export default function VoiceTranslation({
  sourceLanguage,
  targetLanguage,
  model = 'gpt-3.5-turbo',
}: VoiceTranslationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [translationNote, setTranslationNote] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [detectedWrongLanguage, setDetectedWrongLanguage] = useState(false);
  const [detectionDetails, setDetectionDetails] = useState<{
    detectedLang: string;
    confidence: number;
    isReliable: boolean;
  } | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(false);
  const [finalProcessedText, setFinalProcessedText] = useState('');
  const [isProcessingLanguage, setIsProcessingLanguage] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
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
  const [isAndroid, setIsAndroid] = useState(false);
  const [languageIndicator, setLanguageIndicator] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Detect Android specifically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAndroid(/Android/i.test(navigator.userAgent));
    }
  }, []);

  // Implement exact language code mapping as suggested by ChatGPT
  const getLanguageCode = (langCode: string): string => {
    // Direct mapping of language codes to BCP-47 format
    const exactCodes: Record<string, string> = {
      ru: 'ru-RU', // Russian
      es: 'es-ES', // Spanish
      fr: 'fr-FR', // French
      de: 'de-DE', // German
      it: 'it-IT', // Italian
      zh: 'zh-CN', // Chinese (Simplified)
      ja: 'ja-JP', // Japanese
      ar: 'ar-SA', // Arabic
      hi: 'hi-IN', // Hindi
      pt: 'pt-BR', // Portuguese
      nl: 'nl-NL', // Dutch
      ko: 'ko-KR', // Korean
      tr: 'tr-TR', // Turkish
      pl: 'pl-PL', // Polish
      uk: 'uk-UA', // Ukrainian
      he: 'he-IL', // Hebrew
      el: 'el-GR', // Greek
      cs: 'cs-CZ', // Czech
      hu: 'hu-HU', // Hungarian
      sv: 'sv-SE', // Swedish
      fi: 'fi-FI', // Finnish
      da: 'da-DK', // Danish
      ro: 'ro-RO', // Romanian
      no: 'nb-NO', // Norwegian
      en: 'en-US', // English (US)
    };

    return exactCodes[langCode] || langCode;
  };

  // Initialize speech recognition with correct language code
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      // Create new instance to ensure clean state
      const recognition = new SpeechRecognition();

      // Configure the recognition object
      recognition.continuous = true;
      recognition.interimResults = true;

      // Set the exact BCP-47 language code (critical for Android)
      const exactLanguageCode = getLanguageCode(sourceLanguage);
      recognition.lang = exactLanguageCode;

      console.log(
        `Setting speech recognition language to: ${exactLanguageCode}`
      );

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }

        const finalText = transcript.trim();
        setRecordedText(finalText);
        setFinalProcessedText(finalText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        // Show error message
        toast({
          title: 'Recognition Error',
          description: `Error: ${event.error}. Please try again.`,
          variant: 'destructive',
        });

        setIsRecording(false);
        stopTimer();
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
  }, [sourceLanguage, toast]);

  // Simplify the start recording function
  const startRecording = () => {
    setRecordedText('');
    setFinalProcessedText('');
    setShowManualInput(false);

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

      // Show which language we're using
      toast({
        title: `Listening in ${getLanguageByCode(sourceLanguage)?.name}`,
        description: isAndroid
          ? `Using language code: ${exactLanguageCode}`
          : 'Speak clearly for best results',
        duration: 3000,
      });

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

  // New function to process speech immediately when recognized on Android
  const processRecordedSpeech = async (text: string) => {
    if (!text || text.length < 3) return;

    // Use language detection to verify if text was transcribed in the wrong language
    const detection = detectLanguageMismatch(text, sourceLanguage);

    // Save detection details in state
    setDetectionDetails({
      detectedLang: detection.detectedLang,
      confidence: detection.confidence,
      isReliable: detection.isReliable,
    });

    // If it's a reliable detection of English instead of the selected language
    if (
      detection.isMismatch &&
      detection.detectedLang === 'eng' &&
      detection.confidence > 0.5
    ) {
      // Automatically translate to the selected language without user intervention
      setIsProcessingLanguage(true);

      try {
        // Subtle toast to show what's happening (brief notification)
        toast({
          title: 'Converting to ' + getLanguageByCode(sourceLanguage)?.name,
          description: 'Processing speech...',
          duration: 2500,
        });

        const recaptchaToken = recaptchaLoaded
          ? await getToken('translate')
          : '';

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            sourceLanguage: 'en', // The text was detected as English
            targetLanguage: sourceLanguage, // Convert to the language user selected
            model,
            recaptchaToken,
          }),
        });

        const responseText = await response.text();
        let data;

        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error(`Invalid JSON response`);
        }

        if (!response.ok || !data.translatedText) {
          throw new Error(data.error || 'Translation failed');
        }

        // Update with the correctly transcribed text in the target language
        setFinalProcessedText(data.translatedText);

        // No toast here - we want this to be seamless
      } catch (error) {
        console.error('Auto-language processing error:', error);
        // If conversion fails, just use the original text
        setFinalProcessedText(text);

        toast({
          title: 'Speech processing issue',
          description: 'Using original transcription instead',
          variant: 'destructive',
          duration: 3000,
        });
      } finally {
        setIsProcessingLanguage(false);
      }
    } else {
      // If the text is already in the correct language (or detection failed)
      // just use the transcribed text as is
      setFinalProcessedText(text);
    }
  };

  // Update the handleTranslate method to use finalProcessedText
  const handleTranslate = () => {
    if (!recordedText.trim() || isTranslating || isDisabled) return;

    setTranslation('');
    setTranslationNote('');
    setIsTranslating(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: recordedText,
        sourceLanguage,
        targetLanguage,
        model,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setTranslation(data.translatedText);

        // Set translation note if available
        if (data.translationNote) {
          setTranslationNote(data.translationNote);
        }
      })
      .catch((error) => {
        console.error('Translation error:', error);
        toast({
          title: 'Translation Error',
          description: 'Failed to translate. Please try again.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsTranslating(false);
      });
  };

  const playTranslation = () => {
    if (!translation || isPlaying) return;

    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = targetLanguage;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      toast({
        title: 'Playback Error',
        description: 'Failed to play translation. Please try again.',
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

  // Calculate remaining time
  const remainingTime = MAX_RECORDING_TIME - recordingTime;
  // Calculate progress percentage
  const progressPercentage = (recordingTime / MAX_RECORDING_TIME) * 100;

  // Add function to manually detect the language of the recorded text
  const detectTextLanguage = async () => {
    if (!recordedText || recordedText.length < 10) {
      toast({
        title: 'Text Too Short',
        description:
          'Please provide at least 10 characters for reliable detection.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLanguage(true);

    try {
      const detection = detectLanguageMismatch(recordedText, sourceLanguage);

      setDetectionDetails({
        detectedLang: detection.detectedLang,
        confidence: detection.confidence,
        isReliable: detection.isReliable,
      });

      if (detection.detectedLang !== 'und') {
        toast({
          title: 'Language Detected',
          description: `Detected language: ${getFrancLanguageName(
            detection.detectedLang
          )} (${(detection.confidence * 100).toFixed(0)}% confidence)`,
          duration: 4000,
        });

        // If the detected language doesn't match the source language
        if (detection.isMismatch && sourceLanguage !== 'en') {
          setDetectedWrongLanguage(true);

          // Ask if user wants to convert
          toast({
            title: 'Convert Text?',
            description: `Would you like to convert from ${getFrancLanguageName(
              detection.detectedLang
            )} to ${getLanguageByCode(sourceLanguage)?.name}?`,
            duration: 8000,
          });
        }
      } else {
        toast({
          title: 'Detection Failed',
          description:
            'Could not reliably detect the language. Try with more text.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Language detection error:', error);
      toast({
        title: 'Detection Error',
        description: 'An error occurred while detecting the language.',
        variant: 'destructive',
      });
    } finally {
      setIsDetectingLanguage(false);
    }
  };

  // Add an effect to reset language indicator when source language changes
  useEffect(() => {
    setLanguageIndicator(
      getLanguageByCode(sourceLanguage)?.name || sourceLanguage
    );
  }, [sourceLanguage]);

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
                  value={recordedText}
                  onChange={(e) => setRecordedText(e.target.value)}
                  placeholder={`Type your text in ${
                    getLanguageByCode(sourceLanguage)?.name || sourceLanguage
                  }...`}
                  className='min-h-[80px] mb-3'
                />
                <Button
                  onClick={handleTranslate}
                  disabled={!recordedText.trim() || isTranslating || isDisabled}
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
                      <VolumeIcon className='h-4 w-4' />
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
      </div>
    </div>
  );
}
