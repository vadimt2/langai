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
  const [translatedText, setTranslatedText] = useState('');
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

  // Detect Android specifically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAndroid(/Android/i.test(navigator.userAgent));
    }
  }, []);

  // More explicitly initialize speech recognition with correct language
  useEffect(() => {
    let recognition: any = null;

    if (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      // Create a new recognition instance when language changes
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Add extended language code mapping with regional variants
      const languageMapping: Record<string, string[]> = {
        ru: ['ru-RU', 'ru'],
        fr: ['fr-FR', 'fr-CA', 'fr'],
        de: ['de-DE', 'de-AT', 'de'],
        es: ['es-ES', 'es-MX', 'es'],
        it: ['it-IT', 'it'],
        zh: ['zh-CN', 'zh-TW', 'zh'],
        ja: ['ja-JP', 'ja'],
        ar: ['ar-SA', 'ar-EG', 'ar'],
        hi: ['hi-IN', 'hi'],
        pt: ['pt-BR', 'pt-PT', 'pt'],
        en: ['en-US', 'en-GB', 'en-AU', 'en'],
      };

      // For Android, try several language codes to see which ones work best
      if (isAndroid && languageMapping[sourceLanguage]) {
        // Test which language code works best
        const variants = languageMapping[sourceLanguage];
        recognition.lang = variants[0]; // Start with first option

        console.log('Setting Android language to:', recognition.lang);
      } else {
        recognition.lang = sourceLanguage;
      }

      // Add a debug function to log language detection
      const logLanguageInfo = (text: string) => {
        if (text.length < 20) return; // Skip short text

        // Try to detect the actual language being used
        try {
          const detection = detectLanguageMismatch(text, sourceLanguage);

          if (detection.isReliable) {
            const detectedName = getFrancLanguageName(detection.detectedLang);
            console.log(
              `Detected language: ${detectedName} (${
                detection.detectedLang
              }), Confidence: ${(detection.confidence * 100).toFixed(0)}%`
            );

            // Update the language indicator
            setLanguageIndicator(detectedName);
          }
        } catch (e) {
          console.error('Language detection error:', e);
        }
      };

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

        // Log language info for debugging
        logLanguageInfo(finalText);
      };

      recognition.onerror = (event: any) => {
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
          }
        }

        setIsRecording(false);
        stopTimer();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    };
  }, [sourceLanguage, isAndroid, toast]); // Recreate recognition when language changes

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
    setFinalProcessedText('');
    setShowManualInput(false);

    // For Android with non-English, provide a clearer message
    if (sourceLanguage !== 'en' && isAndroid) {
      toast({
        title: `Recording in ${getLanguageByCode(sourceLanguage)?.name}`,
        description:
          'Speak clearly and pause between sentences for better recognition.',
        variant: 'default',
        duration: 4000,
      });
    }

    if (recognitionRef.current) {
      try {
        // Ensure language is set correctly right before starting
        recognitionRef.current.lang = sourceLanguage;

        // Stop any existing recognition first to reset
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors from stopping non-started recognition
        }

        // Small delay to ensure clean restart
        setTimeout(() => {
          recognitionRef.current.start();
          setIsRecording(true);
          startTimer();
        }, 100);
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: 'Recognition Error',
          description: 'Could not start speech recognition. Please try again.',
          variant: 'destructive',
        });
      }
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
  const handleTranslate = async () => {
    // Use the processed text for translation instead of raw recorded text
    const textToTranslate = finalProcessedText || recordedText;

    if (!textToTranslate.trim() || isTranslating) return;

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
          text: textToTranslate,
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

        {/* Language indicator with better guidance for Android */}
        <div className='flex items-center space-x-1'>
          <p className='text-sm text-center'>
            {isRecording
              ? `Recording... Speak now in ${
                  getLanguageByCode(sourceLanguage)?.name
                }`
              : 'Press the microphone button to start recording'}
          </p>

          {/* Information tooltip for Android users */}
          {isAndroid && sourceLanguage !== 'en' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-sm'>
                  <p>For best results on Android:</p>
                  <ul className='list-disc pl-4 text-xs mt-1'>
                    <li>Speak clearly and directly into microphone</li>
                    <li>Pause between phrases for better recognition</li>
                    <li>Avoid background noise</li>
                    <li>Use short, common phrases</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Display current detected language when recording */}
        {isRecording && languageIndicator && (
          <div className='px-2 py-1 bg-primary/10 rounded-full text-xs text-primary-foreground/90 flex items-center space-x-1'>
            <span>Detected language: {languageIndicator}</span>
          </div>
        )}

        {/* Add speech examples for Android users */}
        {isAndroid &&
          sourceLanguage !== 'en' &&
          !isRecording &&
          !recordedText && (
            <div className='w-full max-w-md p-3 bg-muted rounded-md mt-2'>
              <p className='text-sm font-medium'>
                Try these phrases in {getLanguageByCode(sourceLanguage)?.name}:
              </p>
              <div className='mt-2 space-y-1 text-sm'>
                {sourceLanguage === 'ru' && (
                  <>
                    <p>• "Добрый день" (Good afternoon)</p>
                    <p>• "Как дела?" (How are you?)</p>
                    <p>• "Спасибо большое" (Thank you very much)</p>
                  </>
                )}
                {sourceLanguage === 'fr' && (
                  <>
                    <p>• "Bonjour" (Hello)</p>
                    <p>• "Comment ça va?" (How are you?)</p>
                    <p>• "Merci beaucoup" (Thank you very much)</p>
                  </>
                )}
                {sourceLanguage === 'de' && (
                  <>
                    <p>• "Guten Tag" (Good day)</p>
                    <p>• "Wie geht es dir?" (How are you?)</p>
                    <p>• "Vielen Dank" (Thank you very much)</p>
                  </>
                )}
                {sourceLanguage === 'es' && (
                  <>
                    <p>• "Buenos días" (Good morning)</p>
                    <p>• "¿Cómo estás?" (How are you?)</p>
                    <p>• "Muchas gracias" (Thank you very much)</p>
                  </>
                )}
                {!['ru', 'fr', 'de', 'es'].includes(sourceLanguage) && (
                  <p>
                    Try speaking a simple greeting or question in{' '}
                    {getLanguageByCode(sourceLanguage)?.name}
                  </p>
                )}
              </div>
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
              <strong>Language Mismatch:</strong>{' '}
              {isProcessingLanguage ? (
                <>
                  Converting{' '}
                  {detectionDetails &&
                    getFrancLanguageName(detectionDetails.detectedLang)}{' '}
                  to {getLanguageByCode(sourceLanguage)?.name}...
                </>
              ) : (
                <>
                  Detected{' '}
                  {detectionDetails &&
                    getFrancLanguageName(detectionDetails.detectedLang)}{' '}
                  instead of {getLanguageByCode(sourceLanguage)?.name}.
                </>
              )}
            </p>
            {detectionDetails && detectionDetails.isReliable && (
              <p className='text-xs text-amber-600 text-center mt-1'>
                Confidence: {(detectionDetails.confidence * 100).toFixed(0)}%
              </p>
            )}
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
                    onClick={() => processRecordedSpeech(recordedText)}
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
                Type your text in{' '}
                {getLanguageByCode(sourceLanguage)?.name || sourceLanguage}:
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
          <div className='relative'>
            <Textarea
              value={finalProcessedText || recordedText}
              readOnly
              className={`min-h-[80px] ${
                isProcessingLanguage ? 'opacity-70' : ''
              }`}
            />
            {isProcessingLanguage && (
              <div className='absolute inset-0 flex items-center justify-center bg-background/30'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
              </div>
            )}
          </div>

          <div className='flex justify-center mt-4 space-x-2'>
            <Button
              onClick={handleTranslate}
              disabled={
                !recordedText.trim() ||
                isTranslating ||
                isDisabled ||
                isProcessingLanguage
              }
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

            <Button
              variant='outline'
              onClick={detectTextLanguage}
              disabled={
                !recordedText.trim() ||
                isDetectingLanguage ||
                isProcessingLanguage
              }
              className='sm:w-auto'
            >
              {isDetectingLanguage ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Detecting...
                </>
              ) : (
                <>
                  <Languages className='mr-2 h-4 w-4' />
                  Detect Language
                </>
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
