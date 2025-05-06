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

// Type declarations for the Web Speech API - updated with more accurate types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number; // Add this property which exists in the actual API
  start(): void;
  stop(): void;
  abort?(): void; // Add the abort method
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null; // Add this property
}

// Update SpeechRecognitionEvent interface to match the actual Web API
interface SpeechRecognitionEvent {
  resultIndex: number; // Add this property which exists in the actual API
  results: SpeechRecognitionResultList;
}

// Add these interfaces to better match the actual Web API
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
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

// Adjust timing constants for better user experience
const RECORDING_RESTART_DELAY = 1000; // Reduce from 1500ms to 1000ms
const RECORDING_COOLDOWN = 300; // Reduce from 1500ms to 300ms (just enough to prevent double-clicks)
const RECORDING_CLEANUP_TIMEOUT = 500; // Reduce from 800ms to 500ms

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

  // Initialize additional state for Android detection
  const [isAndroid, setIsAndroid] = useState(false);

  // Add state for actively listening status
  const [isActivelyListening, setIsActivelyListening] = useState(true);

  // Add restart counter and mounted refs for safe speech recognition
  const restartAttemptsRef = useRef<number>(0);
  const MAX_RESTART_ATTEMPTS = 3;
  const isMountedRef = useRef<boolean>(true);

  // Add a reference for button cooldown
  const buttonCooldownRef = useRef<boolean>(false);

  // Detect Android device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAndroid(/Android/i.test(navigator.userAgent));
    }
  }, []);

  // Set mounted state on component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize speech recognition with Android-specific handling
  useEffect(() => {
    // Cleanup function only - no initialization here
    return () => {
      // Clean up any existing speech recognition on component unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Completely reworked speech recognition handler with minimal cooldown
  const handleSpeechInput = () => {
    console.log('Speech button clicked, current state:', isListening);

    // Use minimal cooldown only to prevent accidental double-clicks
    if (buttonCooldownRef.current) {
      console.log('Button in cooldown, ignoring click');
      // Remove the toast message - don't tell users to wait
      return;
    }

    // Set a short cooldown
    buttonCooldownRef.current = true;
    setTimeout(() => {
      buttonCooldownRef.current = false;
    }, RECORDING_COOLDOWN);

    if (isListening) {
      // If we're currently listening, stop it
      stopRecognitionCompletely();
    } else {
      // Start fresh with a completely new instance
      createAndStartNewRecognition();
    }
  };

  // Completely stop and clean up speech recognition
  const stopRecognitionCompletely = () => {
    console.log('Stopping speech recognition completely');

    // Update state first
    setIsListening(false);
    setIsActivelyListening(false);

    // Then clean up the recognition object
    if (recognitionRef.current) {
      try {
        // Try to stop it first
        recognitionRef.current.stop();
        console.log('Recognition stopped successfully');
      } catch (e) {
        console.error('Error stopping recognition:', e);

        // Try abort if available
        if (recognitionRef.current.abort) {
          try {
            recognitionRef.current.abort();
          } catch (abortError) {
            // Ignore abort errors
          }
        }
      }

      // Clear all handlers to prevent memory leaks
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
      }

      // Clear reference immediately
      recognitionRef.current = null;
    }

    // Reset restart counter
    restartAttemptsRef.current = 0;
  };

  // Create and start a completely fresh recognition instance
  const createAndStartNewRecognition = () => {
    console.log('Creating a fresh recognition instance');

    // Make sure we're clean first
    stopRecognitionCompletely();

    // Start immediately - reduce waiting time
    // Update UI state immediately to show feedback
    setIsListening(true);

    // Wait a shorter moment for cleanup to complete
    setTimeout(() => {
      if (!isMountedRef.current) return;

      // Check if we can use speech recognition
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        setIsListening(false); // Reset the UI state if not supported
        toast({
          title: 'Not Supported',
          description: 'Speech recognition is not available in your browser.',
          variant: 'destructive',
        });
        return;
      }

      try {
        // Create a new instance
        const recognition = new SpeechRecognitionAPI();

        // Configure settings - IMPORTANT: enable interimResults on all platforms
        recognition.continuous = !isAndroid; // Non-continuous only on Android
        recognition.interimResults = true; // Enable interim results on all platforms

        if ('maxAlternatives' in recognition) {
          (recognition as any).maxAlternatives = 1;
        }

        // Set language
        const exactLanguageCode = getLanguageCode(sourceLanguage);
        recognition.lang = exactLanguageCode;
        console.log(`Using language code: ${exactLanguageCode}`);

        // Handle recognition start
        recognition.onstart = () => {
          if (!isMountedRef.current) return;
          console.log('Recognition started successfully');
          setIsActivelyListening(true);

          toast({
            title: `Listening in ${
              getLanguageByCode(sourceLanguage)?.name || sourceLanguage
            }`,
            description: 'Speak clearly for best results',
            duration: 3000,
          });
        };

        // Completely rewritten results handler for immediate text display
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (!isMountedRef.current) return;

          console.log(`Got results: ${event.results.length} items`);

          // Process all results
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
              console.log(`Final transcript: "${transcript}"`);
            } else {
              interimTranscript += transcript;
              console.log(`Interim transcript: "${transcript}"`);
            }
          }

          // Update UI with both interim and final results
          setInputText((prevText) => {
            // Remove any previous interim results (if any were added)
            const baseText = prevText.replace(/\u200B.*$/, '').trim();

            // Add final transcript if available
            const newBaseText = finalTranscript
              ? (baseText
                  ? baseText + ' ' + finalTranscript
                  : finalTranscript
                ).trim()
              : baseText;

            // Add interim transcript with zero-width space as marker
            const displayText = interimTranscript
              ? newBaseText + ' \u200B' + interimTranscript
              : newBaseText;

            console.log(`Updated full text: "${displayText}"`);
            return displayText;
          });

          // If we have a final result on Android, we need to restart recognition
          if (finalTranscript && isAndroid) {
            // Reset restart counter on successful recognition
            restartAttemptsRef.current = 0;

            // Show we're temporarily paused
            setIsActivelyListening(false);

            // Restart recognition for continuous experience on Android
            if (isListening && isMountedRef.current) {
              createAndStartNewRecognition();
            }
          }
        };

        // Improved error handler
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (!isMountedRef.current) return;

          console.error(`Recognition error: ${event.error}`);
          setIsActivelyListening(false);

          // Don't show "aborted" errors to the user - these are expected during restart
          if (event.error === 'aborted') {
            console.log(
              'Recognition aborted - this is expected during restart'
            );

            // On Android, completely recreate the recognition instance
            if (isAndroid && isListening && isMountedRef.current) {
              // Wait a significant time before restarting
              setTimeout(() => {
                if (isListening && isMountedRef.current) {
                  createAndStartNewRecognition();
                }
              }, RECORDING_RESTART_DELAY);
            }
            return;
          }

          // Don't show common errors on Android that are expected
          if (!(isAndroid && ['no-speech', 'network'].includes(event.error))) {
            toast({
              title: 'Voice Recording Error',
              description: `Error: ${event.error}. Please try again.`,
              variant: 'destructive',
            });
          }

          // For other errors, check if we should retry
          if (
            isAndroid &&
            isListening &&
            restartAttemptsRef.current < MAX_RESTART_ATTEMPTS
          ) {
            restartAttemptsRef.current++;

            // Wait before retrying
            setTimeout(() => {
              if (isListening && isMountedRef.current) {
                createAndStartNewRecognition();
              }
            }, RECORDING_RESTART_DELAY);
          } else {
            // Too many retries - give up
            stopRecognitionCompletely();
          }
        };

        // Improved end handler
        recognition.onend = () => {
          if (!isMountedRef.current) return;

          console.log('Recognition ended naturally');
          setIsActivelyListening(false);

          // Remove any interim results and keep only final text
          setInputText((prevText) => {
            const finalText = prevText.replace(/\u200B.*$/, '').trim();
            console.log(`Finalizing text: "${finalText}"`);
            return finalText;
          });

          // If we're on Android and still supposed to be listening, create a new instance
          if (
            isAndroid &&
            isListening &&
            isMountedRef.current &&
            restartAttemptsRef.current < MAX_RESTART_ATTEMPTS
          ) {
            console.log('Scheduling new recognition instance after end event');

            // Increment restart counter
            restartAttemptsRef.current++;

            // Wait before creating a new instance
            setTimeout(() => {
              if (isListening && isMountedRef.current) {
                createAndStartNewRecognition();
              }
            }, RECORDING_RESTART_DELAY);
          } else if (!isAndroid) {
            // On desktop, end means we're done
            setIsListening(false);
            recognitionRef.current = null;
          }
        };

        // Store reference
        recognitionRef.current = recognition;

        // Start with a small delay
        setTimeout(() => {
          if (isMountedRef.current && recognitionRef.current === recognition) {
            try {
              recognition.start();
              console.log('Started new recognition instance');
            } catch (e) {
              console.error('Error starting recognition:', e);
              stopRecognitionCompletely();

              toast({
                title: 'Recognition Error',
                description:
                  'Could not start speech recording. Please try again.',
                variant: 'destructive',
              });
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error creating recognition:', error);
        stopRecognitionCompletely();

        toast({
          title: 'Recognition Error',
          description: 'Could not start speech recording. Please try again.',
          variant: 'destructive',
        });
      }
    }, 100); // Reduce from RECORDING_CLEANUP_TIMEOUT to 100ms for faster startup
  };

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
      he: 'he-IL', // Hebrew
      yi: 'yi', // Yiddish
      ur: 'ur-PK', // Urdu
      fa: 'fa-IR', // Persian/Farsi
      ps: 'ps-AF', // Pashto
      sd: 'sd-PK', // Sindhi
      dv: 'dv-MV', // Dhivehi
    };

    return exactCodes[langCode] || langCode;
  };

  // Fix the handleMicrophoneClick function
  const handleMicrophoneClick = () => {
    // If we see the spinner but recognition isn't actually happening, reset state
    if (isListening && !isActivelyListening && isAndroid) {
      console.log('Detected stalled recording state - forcing reset');
      // Force cleanup and restart
      stopRecognitionCompletely();

      // Wait a moment before starting again
      setTimeout(() => {
        if (isMountedRef.current) {
          createAndStartNewRecognition();
        }
      }, RECORDING_RESTART_DELAY);

      return;
    }

    // Otherwise use the normal speech input handler
    handleSpeechInput();
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
                  onClick={handleMicrophoneClick}
                  className={`h-8 w-8 rounded-full ${
                    isListening
                      ? isAndroid && !isActivelyListening
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-destructive hover:bg-destructive/90'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  aria-label={
                    isListening ? 'Stop recording' : 'Start voice recording'
                  }
                  title={isListening ? 'Stop recording' : 'Record speech'}
                >
                  {isListening ? (
                    isAndroid && !isActivelyListening ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Mic className='h-4 w-4 text-white' />
                    )
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
