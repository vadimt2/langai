'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Copy,
  Save,
  Wand2,
  ArrowRight,
  X,
  Play,
  Share2,
  Mic,
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
  const { toast } = useToast();
  const { addToHistory } = useHistory();
  const {
    getToken,
    isLoaded: recaptchaLoaded,
    isDisabled,
  } = useRecaptchaContext();

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setTranslatedText(''); // Clear previous translation

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

  const detectLanguage = async () => {
    if (!inputText.trim()) return;

    setIsDetecting(true);
    // Clear previous detected language
    setDetectedLanguage(null);

    try {
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
          text: inputText,
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
        const detectedLanguage = getLanguageByCode(data.language);
        setDetectedLanguage(data.language);

        toast({
          title: 'Language Detected',
          description: `Detected language: ${
            detectedLanguage?.name || data.language
          }`,
        });
      } else {
        toast({
          title: 'Language Confirmed',
          description: `Text appears to be in the selected source language`,
        });
      }
    } catch (error) {
      console.error('Language detection error:', error);
      toast({
        title: 'Detection Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to detect language. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
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
  };

  // Format text for sharing
  const getShareText = () => {
    const sourceLangName =
      getLanguageByCode(sourceLanguage)?.name || sourceLanguage;
    const targetLangName =
      getLanguageByCode(targetLanguage)?.name || targetLanguage;

    return `Original (${sourceLangName}):\n${inputText}\n\nTranslation (${targetLangName}):\n${translatedText}`;
  };

  const handleSpeechInput = () => {
    if (
      !('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)
    ) {
      toast({
        title: 'Speech Recognition Not Supported',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
      return;
    }

    setIsListening(true);

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.lang = sourceLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      toast({
        title: 'Speech Recognition Error',
        description: `Error: ${event.error}`,
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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
                  onClick={detectLanguage}
                  disabled={isDetecting}
                  title='Detect language'
                  className='h-8 px-2 flex-grow sm:flex-grow-0'
                >
                  {isDetecting ? (
                    <Loader2 className='h-4 w-4 mr-0 sm:mr-1 animate-spin' />
                  ) : (
                    <Wand2 className='h-4 w-4 mr-0 sm:mr-1' />
                  )}
                  <span className='hidden sm:inline'>Detect Language</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <Textarea
          placeholder='Enter text to translate (Ctrl+Enter to translate)'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className='min-h-[120px]'
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              if (inputText.trim() && !isTranslating) {
                handleTranslate();
              }
            }
          }}
        />
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
          onClick={handleSpeechInput}
          disabled={isListening}
          variant='outline'
          className='w-10 flex-shrink-0'
          title='Speech input'
        >
          {isListening ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Mic className='h-4 w-4' />
          )}
        </Button>
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
                  <Play className='h-4 w-4 mr-0 sm:mr-1' />
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
        </div>
      )}
    </div>
  );
}
