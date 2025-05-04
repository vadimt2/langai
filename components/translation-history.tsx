'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Play, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useHistory } from '@/context/history-context';
import { formatDistanceToNow } from 'date-fns';
import { CircleFlag } from 'react-circle-flags';
import { getLanguageByCode } from '@/data/languages';
import { useToast } from '@/hooks/use-toast';

// Character limit for text preview
const TEXT_PREVIEW_LIMIT = 150;

export default function TranslationHistory() {
  const { history, clearHistory } = useHistory();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );
  const { toast } = useToast();

  const textHistory = history.filter((item) => item.mode === 'text');
  const voiceHistory = history.filter((item) => item.mode === 'voice');

  const playTranslation = (text: string, language: string, id: string) => {
    if (isPlaying) return;

    setIsPlaying(id);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;

    utterance.onend = () => {
      setIsPlaying(null);
    };

    utterance.onerror = () => {
      setIsPlaying(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Text has been copied to your clipboard',
    });
  };

  // Function to render text with proper truncation
  const renderText = (text: string, id: string, field: string) => {
    const isExpanded = expandedItems[`${id}-${field}`];
    const needsTruncation = text.length > TEXT_PREVIEW_LIMIT;

    if (!needsTruncation) {
      return <p className='whitespace-pre-wrap break-words'>{text}</p>;
    }

    return (
      <div>
        <p className='whitespace-pre-wrap break-words'>
          {isExpanded ? text : `${text.substring(0, TEXT_PREVIEW_LIMIT)}...`}
        </p>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => toggleExpand(`${id}-${field}`)}
          className='mt-2 h-8 text-xs'
        >
          {isExpanded ? (
            <>
              <ChevronUp className='h-3 w-3 mr-1' /> Show less
            </>
          ) : (
            <>
              <ChevronDown className='h-3 w-3 mr-1' /> Show more
            </>
          )}
        </Button>
      </div>
    );
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className='shadow-sm border-gray-100 dark:border-gray-800'>
      {/* Mobile-friendly header with simplified controls */}
      <CardHeader className='flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 border-b gap-2'>
        <div className='flex items-center justify-between w-full sm:w-auto'>
          <div className='flex items-center gap-2'>
            <CardTitle className='text-lg font-medium'>History</CardTitle>
            <span className='text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full'>
              {history.length}
            </span>
          </div>
          <div className='flex items-center gap-2 sm:hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={clearHistory}
              className='h-9 w-9 p-0 rounded-full hover:bg-red-50 hover:text-red-600'
            >
              <Trash2 className='h-4 w-4' />
              <span className='sr-only'>Clear history</span>
            </Button>
          </div>
        </div>
        <div className='hidden sm:flex items-center gap-2'>
          <Button variant='outline' size='sm' className='h-8 text-xs'>
            <span className='sr-only'>View mode</span>
            <span className='inline-flex items-center justify-center w-4 h-4'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='lucide lucide-list'
              >
                <line x1='8' x2='21' y1='6' y2='6' />
                <line x1='8' x2='21' y1='12' y2='12' />
                <line x1='8' x2='21' y1='18' y2='18' />
                <line x1='3' x2='3' y1='6' y2='6' />
                <line x1='3' x2='3' y1='12' y2='12' />
                <line x1='3' x2='3' y1='18' y2='18' />
              </svg>
            </span>
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={clearHistory}
            className='h-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors'
          >
            <Trash2 className='h-4 w-4 mr-1' />
            <span className='text-xs'>Clear</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <Tabs defaultValue='text' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 rounded-none bg-gray-50 dark:bg-gray-900 p-0'>
            <TabsTrigger
              value='text'
              className='rounded-none py-3 data-[state=active]:bg-background'
            >
              Text ({textHistory.length})
            </TabsTrigger>
            <TabsTrigger
              value='voice'
              className='rounded-none py-3 data-[state=active]:bg-background'
            >
              Voice ({voiceHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='text' className='mt-0'>
            {textHistory.length > 0 ? (
              <div className='divide-y'>
                {/* Date grouping header */}
                <div className='px-4 py-2 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-medium text-muted-foreground'>
                  Today
                </div>

                {textHistory.map((item) => {
                  const sourceLanguage = getLanguageByCode(item.sourceLanguage);
                  const targetLanguage = getLanguageByCode(item.targetLanguage);

                  return (
                    <div
                      key={item.id}
                      className='group overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors relative'
                    >
                      {/* Mobile-friendly language header */}
                      <div className='p-4 border-b border-gray-100 dark:border-gray-800'>
                        <div className='flex flex-wrap items-center gap-3 mb-1'>
                          <div className='flex items-center mr-auto'>
                            {sourceLanguage ? (
                              <div className='flex items-center'>
                                <div className='w-6 h-6 rounded-full overflow-hidden mr-1.5'>
                                  <CircleFlag
                                    countryCode={sourceLanguage.countryCode.toLowerCase()}
                                    height={24}
                                    width={24}
                                  />
                                </div>
                                <span className='text-sm font-medium'>
                                  {sourceLanguage.name}
                                </span>
                              </div>
                            ) : (
                              <div className='flex items-center'>
                                <div className='w-6 h-6 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center mr-1.5'>
                                  <span className='text-white text-[9px] font-bold'>
                                    AUTO
                                  </span>
                                </div>
                                <span className='text-sm font-medium'>
                                  Auto
                                </span>
                              </div>
                            )}

                            <span className='mx-2 text-gray-400'>
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='14'
                                height='14'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='lucide lucide-arrow-right'
                              >
                                <path d='M5 12h14' />
                                <path d='m12 5 7 7-7 7' />
                              </svg>
                            </span>

                            {targetLanguage && (
                              <div className='flex items-center'>
                                <div className='w-6 h-6 rounded-full overflow-hidden mr-1.5'>
                                  <CircleFlag
                                    countryCode={targetLanguage.countryCode.toLowerCase()}
                                    height={24}
                                    width={24}
                                  />
                                </div>
                                <span className='text-sm font-medium'>
                                  {targetLanguage.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions row for mobile - larger touch targets */}
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 rounded-full'
                              onClick={() =>
                                playTranslation(
                                  item.translatedText,
                                  item.targetLanguage,
                                  item.id
                                )
                              }
                              disabled={isPlaying !== null}
                            >
                              <Play className='h-4 w-4' />
                              <span className='sr-only'>Play translation</span>
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 rounded-full'
                            >
                              <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                className='lucide lucide-pin'
                              >
                                <line x1='12' x2='12' y1='17' y2='22' />
                                <path d='M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z' />
                              </svg>
                              <span className='sr-only'>Pin translation</span>
                            </Button>
                          </div>
                        </div>

                        <div className='text-xs text-gray-500'>
                          {formatDistanceToNow(new Date(item.timestamp), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>

                      {/* Content section with improved mobile spacing */}
                      <div className='p-4'>
                        <div className='space-y-3'>
                          <div className='relative'>
                            <div className='flex justify-between items-center mb-1.5'>
                              <h4 className='text-xs font-medium text-gray-500'>
                                Original:
                              </h4>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 rounded-full'
                                onClick={() => copyToClipboard(item.sourceText)}
                              >
                                <Copy className='h-4 w-4' />
                                <span className='sr-only'>
                                  Copy original text
                                </span>
                              </Button>
                            </div>
                            <div className='p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-md max-h-[80px] overflow-auto text-sm'>
                              {renderText(item.sourceText, item.id, 'source')}
                            </div>
                          </div>

                          <div className='relative'>
                            <div className='flex justify-between items-center mb-1.5'>
                              <h4 className='text-xs font-medium text-gray-500'>
                                Translation:
                              </h4>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 rounded-full'
                                onClick={() =>
                                  copyToClipboard(item.translatedText)
                                }
                              >
                                <Copy className='h-4 w-4' />
                                <span className='sr-only'>
                                  Copy translated text
                                </span>
                              </Button>
                            </div>
                            <div className='p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-md max-h-[80px] overflow-auto text-sm'>
                              {renderText(
                                item.translatedText,
                                item.id,
                                'translated'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile-friendly action hint */}
                      <div className='p-2 border-t border-gray-100 text-center text-xs text-muted-foreground'>
                        <span className='inline-flex items-center justify-center'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='12'
                            height='12'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            className='lucide lucide-swipe-horizontal mr-1'
                          >
                            <path d='M5 5l11.7 11.7' />
                            <path d='M4 19h8' />
                            <path d='M13 5h7' />
                            <path d='m9 9 11.7 11.8' />
                          </svg>
                          Swipe left to delete
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-10 px-4 text-center'>
                <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='lucide lucide-history text-gray-400'
                  >
                    <path d='M3 3v5h5' />
                    <path d='M3.05 13A9 9 0 1 0 6 5.3L3 8' />
                    <path d='M12 7v5l4 2' />
                  </svg>
                </div>
                <p className='text-sm text-gray-500 max-w-xs'>
                  No translation history yet. Translate some text and save it to
                  see it here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value='voice' className='mt-0'>
            {/* Similar implementation for voice history with the improved mobile UI */}
            {voiceHistory.length > 0 ? (
              <div className='divide-y'>
                {/* Voice history with improved mobile UI */}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-10 px-4 text-center'>
                <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='lucide lucide-mic text-gray-400'
                  >
                    <path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' />
                    <path d='M19 10v2a7 7 0 0 1-14 0v-2' />
                    <line x1='12' x2='12' y1='19' y2='22' />
                  </svg>
                </div>
                <p className='text-sm text-gray-500 max-w-xs'>
                  No voice translation history yet. Try using the voice
                  translation feature.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
