'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Copy,
  Save,
  Wand2,
  ArrowRight,
  X,
  Volume2,
  Share2,
  Mic,
  Languages,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHistory } from '@/context/history-context';
import { getLanguageByCode } from '@/data/languages';
import { useRecaptchaContext } from '@/context/recaptcha-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShareDialog } from '@/components/share-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

// Type declarations for the Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

interface TextTranslationProps {
  sourceLanguage: string;
  targetLanguage: string;
  model?: string;
  onSourceLanguageChange?: (code: string) => void;
}

export default function TextTranslation({
  sourceLanguage,
  targetLanguage,
  model = 'gpt-3.5-turbo',
  onSourceLanguageChange,
}: TextTranslationProps) {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [translationNote, setTranslationNote] = useState<string | null>(null);
  const { toast } = useToast();
  const { addToHistory } = useHistory();
  const {
    getToken,
    isLoaded: recaptchaLoaded,
    isDisabled,
  } = useRecaptchaContext();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const { pathname } = router;

  // Initialize additional state for Android detection
  const [isAndroid, setIsAndroid] = useState(false);

  // Detect Android device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAndroid(/Android/i.test(navigator.userAgent));
    }
  }, []);

  // Initialize speech recognition with Android-specific handling
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;

    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        // Configure recognition based on platform
        recognition = new SpeechRecognitionAPI();

        // On Android, we need different settings
        if (isAndroid) {
          recognition.continuous = false; // Use non-continuous mode for Android
          recognition.interimResults = false; // Disable interim results on Android

          // Use shorter phrases for better reliability on Android
          recognition.maxAlternatives = 1;
        } else {
          // Desktop settings
          recognition.continuous = true;
          recognition.interimResults = true;
        }

        // Set language immediately
        const exactLanguageCode = getLanguageCode(sourceLanguage);
        recognition.lang = exactLanguageCode;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const resultIndex = event.resultIndex;
          let transcript = '';

          // Process results
          for (let i = resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }

          const finalText = transcript.trim();
          if (finalText) {
            // On Android, replace text if this is the first chunk or append with space
            if (isAndroid) {
              setInputText((prevText) => {
                if (!prevText) return finalText;
                return prevText + ' ' + finalText;
              });

              // On Android, restart recognition for continuous experience
              try {
                if (isListening) {
                  recognition?.stop();
                  setTimeout(() => {
                    if (isListening && recognition) {
                      recognition.start();
                    }
                  }, 300);
                }
              } catch (e) {
                console.error('Error restarting Android recognition:', e);
              }
            } else {
              // Desktop behavior
              setInputText((prevText) => {
                if (!prevText) return finalText;
                return prevText + ' ' + finalText;
              });
            }

            // Detect language for longer inputs
            if (finalText.length > 10) {
              detectLanguage(finalText);
            }
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);

          // Don't show error for Android "no-speech" as we restart automatically
          if (!(isAndroid && event.error === 'no-speech')) {
            toast({
              title: 'Voice Recording Error',
              description: `Error: ${event.error}. Please try again.`,
              variant: 'destructive',
            });
          }

          // For Android, try to restart on certain errors
          if (isAndroid && ['network', 'aborted'].includes(event.error)) {
            try {
              setTimeout(() => {
                if (isListening && recognition) {
                  recognition.start();
                }
              }, 300);
            } catch (e) {
              console.error(
                'Failed to restart Android recognition after error'
              );
            }
          }
        };

        recognition.onend = () => {
          // On Android, if still in listening mode, restart recognition
          if (isAndroid && isListening) {
            try {
              setTimeout(() => {
                if (isListening && recognition) {
                  recognition.start();
                }
              }, 300);
            } catch (e) {
              console.error('Error restarting recognition on Android:', e);
              setIsListening(false);
            }
          } else if (!isAndroid) {
            // On desktop, just update state
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [sourceLanguage, isAndroid, isListening, toast]);

  // Get language code in BCP-47 format for speech recognition
  const getLanguageCode = (langCode: string): string => {
    // Direct mapping of language codes to BCP-47 format
    const exactCodes: Record<string, string> = {
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
    };

    return exactCodes[langCode] || langCode;
  };

  // Handle speech input with better language detection
  const handleSpeechInput = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Start voice recording with Android optimizations
  const startRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Speech Recognition Unavailable',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Clear the input text when starting a new recording session
      setInputText('');
      setDetectedLanguage(null);

      // Always update the language before starting
      const exactLanguageCode = getLanguageCode(sourceLanguage);
      recognitionRef.current.lang = exactLanguageCode;

      // Show toast with platform-specific guidance
      toast({
        title: `Listening in ${
          getLanguageByCode(sourceLanguage)?.name || sourceLanguage
        }`,
        description: isAndroid
          ? 'Speak in short phrases for best results'
          : 'Speak clearly for best results',
        duration: 3000,
      });

      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
      toast({
        title: 'Recognition Error',
        description: 'Could not start speech recognition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Stop recording with special handling for Android
  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        // On Android, we need to explicitly set the state since onend might try to restart
        if (isAndroid) {
          setIsListening(false);
        }
      } catch (e) {
        console.error('Error stopping recognition:', e);
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setTranslatedText(''); // Clear previous translation
    setTranslationNote(null); // Clear previous translation note

    try {
      // Get reCAPTCHA token
      let recaptchaToken = null;
      if (recaptchaLoaded) {
        recaptchaToken = await getToken('translate');
        if (!recaptchaToken && !isDisabled) {
          console.warn('Failed to get reCAPTCHA token');
          // Continue without token in development, but show a warning
          if (process.env.NODE_ENV === 'development') {
            toast({
              title: 'reCAPTCHA Warning',
              description:
                'Continuing without security verification in development mode',
              variant: 'destructive',
            });
          }
        }
      }

      // Log the request for debugging
      console.log('Translation request:', {
        text: inputText.substring(0, 50) + '...',
        sourceLanguage,
        targetLanguage,
        model,
        hasRecaptchaToken: !!recaptchaToken,
        recaptchaDisabled: isDisabled,
      });

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          sourceLanguage,
          targetLanguage,
          model,
          recaptchaToken,
        }),
      });

      // First check if we got a response at all
      if (!response) {
        throw new Error('No response from translation API');
      }

      // Log the response status for debugging
      console.log('Translation response status:', response.status);

      // Get the response text first (don't try to parse as JSON yet)
      const responseText = await response.text();

      // Log the raw response for debugging
      console.log(
        'Translation raw response:',
        responseText.substring(0, 100) + '...'
      );

      // Now try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      // Check if the response was successful
      if (!response.ok) {
        // Special handling for reCAPTCHA failures
        if (data.recaptchaFailed) {
          throw new Error(
            'Security verification failed. Please try again later.'
          );
        }
        throw new Error(data.error || 'Translation failed');
      }

      // Check if we have the expected data
      if (!data.translatedText) {
        throw new Error('No translation returned');
      }

      setTranslatedText(data.translatedText);

      // Set translation note if available
      if (data.translationNote) {
        setTranslationNote(data.translationNote);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to translate text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    toast({
      title: 'Copied',
      description: 'Translation copied to clipboard',
    });
  };

  const handleSave = () => {
    if (inputText && translatedText) {
      addToHistory({
        sourceLanguage,
        targetLanguage,
        sourceText: inputText,
        translatedText,
        timestamp: new Date().toISOString(),
        mode: 'text',
      });

      toast({
        title: 'Saved',
        description: 'Translation saved to history',
      });
    }
  };

  const handlePlay = () => {
    if (translatedText && !isPlaying) {
      setIsPlaying(true);

      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = targetLanguage;

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: 'Playback Error',
          description: 'Failed to play the translation audio',
          variant: 'destructive',
        });
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Detect language function
  const detectLanguage = async (text: string) => {
    if (!text.trim()) return;

    try {
      setIsDetecting(true);
      // Clear previous detected language if it's a new detection from button click
      if (text === inputText) {
        setDetectedLanguage(null);
      }

      // Get reCAPTCHA token
      let recaptchaToken = null;
      if (recaptchaLoaded) {
        recaptchaToken = await getToken('detect_language');
      }

      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          recaptchaToken,
        }),
      });

      // Get the response text first
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse detection response as JSON:', e);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      if (!response.ok) {
        // Special handling for reCAPTCHA failures
        if (data.recaptchaFailed) {
          throw new Error(
            'Security verification failed. Please try again later.'
          );
        }
        throw new Error(data.error || 'Language detection failed');
      }

      if (!data.language) {
        throw new Error('No language detected');
      }

      if (data.language && data.language !== sourceLanguage) {
        const detectedLang = getLanguageByCode(data.language);
        setDetectedLanguage(data.language);

        // Only show toast for manual detection, not for automatic detection during speech
        if (text === inputText) {
          toast({
            title: 'Language Detected',
            description: `Detected language: ${
              detectedLang?.name || data.language
            }`,
          });
        }
      } else if (text === inputText) {
        // Only show toast for manual detection
        toast({
          title: 'Language Confirmed',
          description: `Text appears to be in the selected source language`,
        });
      }
    } catch (error) {
      console.error('Language detection error:', error);
      // Only show toast for manual detection
      if (text === inputText) {
        toast({
          title: 'Detection Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to detect language. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDetecting(false);
    }
  };

  // Manually detect language from button click
  const handleDetectLanguage = () => {
    detectLanguage(inputText);
  };

  const switchToDetectedLanguage = () => {
    if (detectedLanguage && onSourceLanguageChange) {
      onSourceLanguageChange(detectedLanguage);
      setDetectedLanguage(null); // Clear after switching

      toast({
        title: 'Language Updated',
        description: `Source language changed to ${
          getLanguageByCode(detectedLanguage)?.name || detectedLanguage
        }`,
      });
    }
  };

  const handleClearInput = () => {
    setInputText('');
    setDetectedLanguage(null);
  };

  const handleClearTranslation = () => {
    setTranslatedText('');
    setTranslationNote(null);
  };

  // Format text for sharing
  const getShareText = () => {
    const sourceLangName =
      getLanguageByCode(sourceLanguage)?.name || sourceLanguage;
    const targetLangName =
      getLanguageByCode(targetLanguage)?.name || targetLanguage;

    return `Original (${sourceLangName}):\n${inputText}\n\nTranslation (${targetLangName}):\n${translatedText}`;
  };

  return (
    <div className='space-y-4 mt-4'>
      <div>
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2'>
          <div className='text-sm text-muted-foreground'>Source Text</div>
          <div className='flex flex-wrap gap-1'>
            {inputText.trim() && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleClearInput}
                        className='h-8 px-2 flex-grow sm:flex-grow-0'
                      >
                        <X className='h-4 w-4 mr-0 sm:mr-1' />
                        <span className='hidden sm:inline'>Clear</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear text</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleDetectLanguage}
                  disabled={isDetecting || isTranslating}
                  title='Detect language'
                  className='h-8 px-2 flex-grow sm:flex-grow-0'
                >
                  {isDetecting ? (
                    <Loader2 className='h-4 w-4 mr-0 sm:mr-1 animate-spin' />
                  ) : (
                    <Languages className='h-4 w-4 mr-0 sm:mr-1' />
                  )}
                  <span className='hidden sm:inline'>Detect Language</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className='space-y-2'>
          <div className='flex flex-col gap-2 relative'>
            <div className='relative'>
              <Textarea
                placeholder={`Enter text in ${
                  getLanguageByCode(sourceLanguage)?.name || sourceLanguage
                }...`}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  // When text is entered manually, clear detected language
                  if (detectedLanguage) {
                    setDetectedLanguage(null);
                  }
                }}
                className='min-h-[150px] pr-12'
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (inputText.trim() && !isTranslating) {
                      handleTranslate();
                    }
                  }
                }}
              />
              <div className='absolute right-3 top-3 flex flex-col gap-2'>
                {inputText && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleClearInput}
                    className='h-8 w-8 rounded-full bg-muted/50 hover:bg-muted'
                    aria-label='Clear input'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}

                {/* Voice recording button in input field */}
                <Button
                  variant={isListening ? 'destructive' : 'ghost'}
                  size='icon'
                  onClick={handleSpeechInput}
                  className={`h-8 w-8 rounded-full ${
                    isListening
                      ? 'bg-destructive hover:bg-destructive/90'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  aria-label={
                    isListening ? 'Stop recording' : 'Start voice recording'
                  }
                  title={isListening ? 'Stop recording' : 'Record speech'}
                >
                  {isListening ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Mic className='h-4 w-4' />
                  )}
                </Button>

                {detectedLanguage && sourceLanguage !== detectedLanguage && (
                  <div
                    className='ml-2 mt-1 text-xs text-blue-500 cursor-pointer flex items-center'
                    onClick={switchToDetectedLanguage}
                  >
                    Switch to {getLanguageByCode(detectedLanguage)?.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {detectedLanguage &&
        detectedLanguage !== sourceLanguage &&
        onSourceLanguageChange && (
          <Alert className='flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted p-3 gap-2'>
            <AlertDescription className='flex-1 text-sm'>
              Detected language:{' '}
              {getLanguageByCode(detectedLanguage)?.name || detectedLanguage}
            </AlertDescription>
            <Button
              variant='outline'
              size='sm'
              className='self-stretch sm:self-auto flex items-center justify-center'
              onClick={switchToDetectedLanguage}
            >
              Switch to this language
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </Alert>
        )}

      <div className='flex justify-center gap-2'>
        <Button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          className='w-full sm:w-48 md:w-56'
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

      {translatedText && (
        <div className='space-y-2'>
          <div>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2'>
              <div className='text-sm text-muted-foreground'>Translation</div>
              <div className='flex flex-wrap gap-1'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleClearTranslation}
                        className='h-8 px-2 flex-grow sm:flex-grow-0'
                      >
                        <X className='h-4 w-4 mr-0 sm:mr-1' />
                        <span className='hidden sm:inline'>Clear</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear translation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleCopy}
                  title='Copy to clipboard'
                  className='h-8 px-2 flex-grow sm:flex-grow-0'
                >
                  <Copy className='h-4 w-4 mr-0 sm:mr-1' />
                  <span className='hidden sm:inline'>Copy</span>
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handlePlay}
                  disabled={isPlaying}
                  title='Listen to translation'
                  className='h-8 px-2 flex-grow sm:flex-grow-0'
                >
                  <Volume2 className='h-4 w-4 mr-0 sm:mr-1' />
                  <span className='hidden sm:inline'>
                    {isPlaying ? 'Playing...' : 'Play'}
                  </span>
                </Button>

                <ShareDialog textToShare={getShareText()} />

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleSave}
                  title='Save to history'
                  className='h-8 px-2 flex-grow sm:flex-grow-0'
                >
                  <Save className='h-4 w-4 mr-0 sm:mr-1' />
                  <span className='hidden sm:inline'>Save</span>
                </Button>
              </div>
            </div>
            <Textarea
              value={translatedText}
              readOnly
              className='min-h-[120px]'
            />
          </div>

          {/* Display Translation Note if available */}
          {translationNote && (
            <div className='mt-4 p-4 bg-muted rounded-md border border-muted-foreground/20'>
              <div dangerouslySetInnerHTML={{ __html: translationNote }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
