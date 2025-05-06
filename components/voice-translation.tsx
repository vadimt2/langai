'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Play, Loader2, Save, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHistory } from '@/context/history-context';
import { useMobile } from '@/hooks/use-mobile';
import { useRecaptchaContext } from '@/context/recaptcha-context';
import { Progress } from '@/components/ui/progress';
import { getLanguageByCode } from '@/data/languages';

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
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [translationNote, setTranslationNote] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [recognitionFailed, setRecognitionFailed] = useState(false);
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
  const [detectedWrongLanguage, setDetectedWrongLanguage] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Detect Android specifically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAndroid(/Android/i.test(navigator.userAgent));
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }

        const finalText = transcript.trim();
        setRecordedText(finalText);

        // Check if the detected text appears to be in the wrong language
        if (isAndroid && checkLanguageMismatch(finalText)) {
          setDetectedWrongLanguage(true);

          // Show options to the user
          toast({
            title: 'Wrong Language Detected',
            description: `Android detected English instead of ${
              getLanguageByCode(sourceLanguage)?.name
            }. Converting automatically...`,
            duration: 5000,
          });

          // Auto-translate the English text to the selected language
          autoCorrectLanguage(finalText);
        } else {
          setDetectedWrongLanguage(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);

        // Show appropriate error messages
        if (event.error === 'no-speech') {
          toast({
            title: 'No Speech Detected',
            description: 'No speech was detected. Please try again.',
            variant: 'destructive',
          });
        } else if (
          event.error === 'not-allowed' ||
          event.error === 'permission-denied'
        ) {
          toast({
            title: 'Microphone Access Denied',
            description:
              'Please allow microphone access to use voice translation.',
            variant: 'destructive',
          });
        } else if (event.error === 'audio-capture') {
          toast({
            title: 'Microphone Error',
            description:
              'No microphone was found or it is not working properly.',
            variant: 'destructive',
          });
        } else if (event.error === 'language-not-supported') {
          toast({
            title: 'Language Not Supported',
            description: `The selected language (${
              getLanguageByCode(sourceLanguage)?.name || sourceLanguage
            }) is not supported by your browser's speech recognition.`,
            variant: 'destructive',
          });

          // Show manual input option for Android devices with non-English languages
          if (isAndroid && sourceLanguage !== 'en') {
            setShowManualInput(true);
            setRecognitionFailed(true);
          }
        } else {
          toast({
            title: 'Recognition Error',
            description: `Error: ${event.error}. Please try again.`,
            variant: 'destructive',
          });

          // Show manual input option for Android devices with any error
          if (isAndroid && sourceLanguage !== 'en') {
            setShowManualInput(true);
            setRecognitionFailed(true);
          }
        }

        setIsRecording(false);
        stopTimer();
      };
    } else {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopTimer();
    };
  }, [toast]);

  // Set language for speech recognition
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLanguage;
    }
  }, [sourceLanguage]);

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

  const startRecording = () => {
    setRecordedText('');
    setShowManualInput(false);
    setRecognitionFailed(false);
    setDetectedWrongLanguage(false);

    // Android-specific warning for non-English languages
    if (sourceLanguage !== 'en' && isAndroid) {
      toast({
        title: 'Android Recognition Limitation',
        description: `Warning: Android may detect English even when speaking ${
          getLanguageByCode(sourceLanguage)?.name
        }. Manual input may be needed.`,
        variant: 'destructive',
        duration: 8000,
      });
    }
    // General mobile warning
    else if (sourceLanguage !== 'en' && isMobile) {
      toast({
        title: 'Mobile Speech Recognition Limitation',
        description:
          'Speech recognition on mobile devices works best with English. Other languages may have limited or no support.',
        variant: 'default',
        duration: 5000,
      });
    }
    // Desktop warning
    else if (sourceLanguage !== 'en') {
      toast({
        title: 'Speech Recognition Limitation',
        description:
          'Note: Speech recognition works best with English. Your selected language may have limited support.',
        variant: 'default',
        duration: 5000,
      });
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = sourceLanguage;
      recognitionRef.current.start();
    }
    setIsRecording(true);
    startTimer();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();
  };

  const handleTranslate = async () => {
    if (!recordedText.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslationNote(null); // Clear previous notes

    try {
      const recaptchaToken = recaptchaLoaded ? await getToken('translate') : '';

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: recordedText,
          sourceLanguage,
          targetLanguage,
          model,
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
        console.error('Failed to parse response as JSON:', e);
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
        throw new Error(data.error || 'Translation failed');
      }

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
            : 'Failed to translate voice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const playTranslation = () => {
    if (!translatedText || isPlaying) return;

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
        description: 'Failed to play translation. Please try again.',
        variant: 'destructive',
      });
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (recordedText && translatedText) {
      addToHistory({
        sourceLanguage,
        targetLanguage,
        sourceText: recordedText,
        translatedText,
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

  // Add language mismatch detection function
  const checkLanguageMismatch = (text: string) => {
    // Skip for English source language or short texts
    if (sourceLanguage === 'en' || text.length < 4) return false;

    // Russian: Check for Cyrillic characters
    if (sourceLanguage === 'ru') {
      const cyrillicPattern = /[\u0400-\u04FF]/g;
      const cyrillicChars = text.match(cyrillicPattern) || [];
      const cyrillicRatio = cyrillicChars.length / text.length;

      if (cyrillicRatio < 0.5) {
        return true;
      }
    }

    // Chinese: Check for Chinese characters
    if (sourceLanguage === 'zh') {
      const chinesePattern = /[\u4E00-\u9FFF]/g;
      const chineseChars = text.match(chinesePattern) || [];
      const chineseRatio = chineseChars.length / text.length;

      if (chineseRatio < 0.5) {
        return true;
      }
    }

    // Japanese: Check for Japanese characters
    if (sourceLanguage === 'ja') {
      const japanesePattern = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/g;
      const japaneseChars = text.match(japanesePattern) || [];
      const japaneseRatio = japaneseChars.length / text.length;

      if (japaneseRatio < 0.5) {
        return true;
      }
    }

    // Arabic: Check for Arabic characters
    if (sourceLanguage === 'ar') {
      const arabicPattern = /[\u0600-\u06FF]/g;
      const arabicChars = text.match(arabicPattern) || [];
      const arabicRatio = arabicChars.length / text.length;

      if (arabicRatio < 0.5) {
        return true;
      }
    }

    // Greek: Check for Greek characters
    if (sourceLanguage === 'el') {
      const greekPattern = /[\u0370-\u03FF]/g;
      const greekChars = text.match(greekPattern) || [];
      const greekRatio = greekChars.length / text.length;

      if (greekRatio < 0.5) {
        return true;
      }
    }

    // No mismatch detected with the checks above
    return false;
  };

  // Add function to automatically translate misdetected English text to the selected language
  const autoCorrectLanguage = async (englishText: string) => {
    if (!englishText.trim() || sourceLanguage === 'en') return;

    setIsTranscribing(true);
    try {
      // Show toast to inform user about auto-correction
      toast({
        title: 'Converting to correct language',
        description: `Converting detected English to ${
          getLanguageByCode(sourceLanguage)?.name
        }...`,
        duration: 3000,
      });

      const recaptchaToken = recaptchaLoaded ? await getToken('translate') : '';

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: englishText,
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

      // Update the recorded text with the translated version
      setRecordedText(data.translatedText);
      setDetectedWrongLanguage(false);

      toast({
        title: 'Converted Successfully',
        description: `Speech has been converted to ${
          getLanguageByCode(sourceLanguage)?.name
        }`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Auto-correction error:', error);
      toast({
        title: 'Conversion Error',
        description:
          error instanceof Error ? error.message : 'Failed to convert language',
        variant: 'destructive',
      });
    } finally {
      setIsTranscribing(false);
    }
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

        <p className='text-sm text-center'>
          {isRecording
            ? 'Recording... Speak now'
            : 'Press the microphone button to start recording'}
        </p>

        {/* Add current language badge while recording */}
        {isRecording && (
          <div className='px-2 py-1 bg-primary/10 rounded-full text-xs text-primary-foreground/90 inline-flex items-center space-x-1'>
            <span>
              Listening in:{' '}
              {getLanguageByCode(sourceLanguage)?.name || sourceLanguage}
            </span>
            {sourceLanguage !== 'en' && isAndroid && (
              <span className='text-amber-500 ml-1'>
                (may default to English)
              </span>
            )}
          </div>
        )}

        {/* Show manual input suggestion and button for Android users */}
        {isAndroid &&
          sourceLanguage !== 'en' &&
          !isRecording &&
          !showManualInput && (
            <div className='text-center'>
              <p className='text-xs text-amber-600 mt-1 mb-2'>
                Android has limited support for{' '}
                {getLanguageByCode(sourceLanguage)?.name || sourceLanguage}{' '}
                speech recognition.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowManualInput(true)}
                className='text-xs'
              >
                Switch to manual text input
              </Button>
            </div>
          )}

        {/* Show wrong language warning if detected */}
        {detectedWrongLanguage && !showManualInput && (
          <div className='w-full max-w-md p-3 bg-amber-50 border border-amber-200 rounded-md'>
            <p className='text-sm text-amber-700 text-center'>
              <strong>Language Mismatch Detected:</strong>{' '}
              {isTranscribing ? (
                <>
                  Converting English to{' '}
                  {getLanguageByCode(sourceLanguage)?.name}...
                </>
              ) : (
                <>
                  Android recognized English instead of{' '}
                  {getLanguageByCode(sourceLanguage)?.name}.
                </>
              )}
            </p>
            <div className='flex justify-center mt-2 space-x-2'>
              {isTranscribing ? (
                <div className='flex items-center space-x-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span className='text-xs'>Converting...</span>
                </div>
              ) : (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowManualInput(true)}
                    className='text-xs'
                  >
                    Manual Input
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => autoCorrectLanguage(recordedText)}
                    className='text-xs'
                  >
                    Try Auto-Convert
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setDetectedWrongLanguage(false);
                      setRecordedText('');
                    }}
                    className='text-xs'
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Manual input option UI */}
        {showManualInput && (
          <div className='w-full max-w-md mt-4'>
            <div className='flex justify-between items-center mb-2'>
              <p className='text-sm'>
                {recognitionFailed
                  ? 'Speech recognition failed. Type your text:'
                  : `Type your text in ${
                      getLanguageByCode(sourceLanguage)?.name || sourceLanguage
                    }:`}
              </p>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowManualInput(false)}
                className='text-xs'
              >
                Try voice again
              </Button>
            </div>
            <Textarea
              value={recordedText}
              onChange={(e) => setRecordedText(e.target.value)}
              placeholder={`Type your text in ${
                getLanguageByCode(sourceLanguage)?.name || sourceLanguage
              }...`}
              className='min-h-[80px]'
            />

            {/* Translation button */}
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

        {isRecording && (
          <div className='w-full max-w-md space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='flex items-center text-muted-foreground'>
                <Clock className='h-4 w-4 mr-1' />
                {formatTime(recordingTime)}
              </span>
              <span className='text-muted-foreground'>Max: 4:00</span>
            </div>
            <Progress value={progressPercentage} className='h-2' />
            <p className='text-xs text-center text-muted-foreground'>
              {remainingTime <= 30 ? (
                <span className='text-red-500 font-medium'>
                  {remainingTime} seconds remaining
                </span>
              ) : (
                <span>{formatTime(remainingTime)} remaining</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Show recorded text UI only if we have text from speech recognition (not manual input) */}
      {recordedText && !showManualInput && (
        <div>
          <Textarea value={recordedText} readOnly className='min-h-[80px]' />

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

      {translatedText && (
        <div className='space-y-2'>
          <Textarea value={translatedText} readOnly className='min-h-[80px]' />

          {/* Display Translation Note if available */}
          {translationNote && (
            <div className='mt-4 p-4 bg-muted rounded-md border border-muted-foreground/20'>
              <div dangerouslySetInnerHTML={{ __html: translationNote }} />
            </div>
          )}

          <div className='flex justify-center space-x-2'>
            <Button
              onClick={playTranslation}
              disabled={isPlaying}
              variant='outline'
            >
              {isPlaying ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Playing...
                </>
              ) : (
                <>
                  <Play className='mr-2 h-4 w-4' />
                  Play
                </>
              )}
            </Button>
            <Button onClick={handleSave} variant='outline'>
              <Save className='mr-2 h-4 w-4' />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
