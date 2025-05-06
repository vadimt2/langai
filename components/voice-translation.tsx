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
        setRecordedText(transcript.trim());
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
        } else {
          toast({
            title: 'Recognition Error',
            description: `Error: ${event.error}. Please try again.`,
            variant: 'destructive',
          });
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

    // Mobile-specific warning for non-English languages
    if (sourceLanguage !== 'en' && isMobile) {
      toast({
        title: 'Mobile Speech Recognition Limitation',
        description:
          'Speech recognition on mobile devices works best with English. Other languages may have limited or no support depending on your device and browser.',
        variant: 'default',
        duration: 5000,
      });
    } else if (sourceLanguage !== 'en') {
      toast({
        title: 'Speech Recognition Limitation',
        description:
          'Note: Speech recognition works best with English. Your selected language may have limited support depending on your browser and device.',
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

      {recordedText && (
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
