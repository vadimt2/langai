'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TextTranslation from '@/components/text-translation';
import ImageTranslation from '@/components/image-translation';
import DocumentTranslation from '@/components/document-translation';
import AudioTranslation from './audio-translation';
import { AlignLeft, Image, FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

// Client component that uses useSearchParams
function TranslationTabsClient({
  sourceLanguage,
  targetLanguage,
  model,
  onSourceLanguageChange,
}: {
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
  onSourceLanguageChange: (code: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Valid tab options
  const validTabs = ['text', 'voice', 'image', 'document'];

  // Initialize with URL param or default to 'text'
  const [activeTab, setActiveTab] = useState<string>(() => {
    return validTabs.includes(tabParam || '') ? tabParam! : 'text';
  });

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Create new URL with the tab parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);

    // Update URL without refreshing the page
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Sync with URL on initial load and URL changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
      <div className='w-full bg-gray-50/60 dark:bg-[#1e2a3b] rounded-lg overflow-hidden'>
        <TabsList className='flex w-full justify-between bg-transparent border-0 p-0 h-auto overflow-x-auto'>
          <TabsTrigger
            value='text'
            className={cn(
              'flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-none min-w-[70px]',
              'flex-1 border-b-2 border-transparent transition-all',
              'hover:bg-white/70 dark:hover:bg-[#263244]/80',
              'focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-[#263244]',
              'data-[state=active]:border-b-2 data-[state=active]:border-black dark:data-[state=active]:border-white',
              'data-[state=active]:bg-white dark:data-[state=active]:bg-transparent',
              'data-[state=active]:text-black dark:data-[state=active]:text-white',
              'text-gray-700 dark:text-gray-300'
            )}
            aria-label='Text translation tab'
          >
            <AlignLeft className='h-[18px] w-[18px]' />
            <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
              Text
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='image'
            className={cn(
              'flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-none min-w-[70px]',
              'flex-1 border-b-2 border-transparent transition-all',
              'hover:bg-white/70 dark:hover:bg-[#263244]/80',
              'focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-[#263244]',
              'data-[state=active]:border-b-2 data-[state=active]:border-black dark:data-[state=active]:border-white',
              'data-[state=active]:bg-white dark:data-[state=active]:bg-transparent',
              'data-[state=active]:text-black dark:data-[state=active]:text-white',
              'text-gray-700 dark:text-gray-300'
            )}
            aria-label='Image translation tab'
          >
            <Image className='h-[18px] w-[18px]' />
            <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
              Image
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='document'
            className={cn(
              'flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-none min-w-[70px]',
              'flex-1 border-b-2 border-transparent transition-all',
              'hover:bg-white/70 dark:hover:bg-[#263244]/80',
              'focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-[#263244]',
              'data-[state=active]:border-b-2 data-[state=active]:border-black dark:data-[state=active]:border-white',
              'data-[state=active]:bg-white dark:data-[state=active]:bg-transparent',
              'data-[state=active]:text-black dark:data-[state=active]:text-white',
              'text-gray-700 dark:text-gray-300'
            )}
            aria-label='Document translation tab'
          >
            <FileText className='h-[18px] w-[18px]' />
            <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
              Document
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='voice'
            className={cn(
              'flex items-center justify-center gap-1.5 py-3 px-3 sm:px-4 rounded-none min-w-[70px]',
              'flex-1 border-b-2 border-transparent transition-all',
              'hover:bg-white/70 dark:hover:bg-[#263244]/80',
              'focus-visible:outline-none focus-visible:bg-white/70 dark:focus-visible:bg-[#263244]',
              'data-[state=active]:border-b-2 data-[state=active]:border-black dark:data-[state=active]:border-white',
              'data-[state=active]:bg-white dark:data-[state=active]:bg-transparent',
              'data-[state=active]:text-black dark:data-[state=active]:text-white',
              'text-gray-700 dark:text-gray-300'
            )}
            aria-label='Voice translation tab'
          >
            <Mic className='h-[18px] w-[18px]' />
            <span className='text-xs sm:text-sm font-medium whitespace-nowrap'>
              Voice
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value='text' className='mt-4'>
        <TextTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
          onSourceLanguageChange={onSourceLanguageChange}
        />
      </TabsContent>

      <TabsContent value='voice' className='mt-4'>
        <AudioTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
        />
      </TabsContent>

      <TabsContent value='image' className='mt-4'>
        <ImageTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
        />
      </TabsContent>

      <TabsContent value='document' className='mt-4'>
        <DocumentTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
        />
      </TabsContent>
    </Tabs>
  );
}

// Fallback component while loading
function TranslationTabsFallback() {
  return (
    <div className='w-full space-y-4'>
      <div className='w-full bg-gray-50/60 dark:bg-[#1e2a3b] rounded-lg overflow-hidden'>
        <div className='flex w-full justify-between overflow-x-auto p-1'>
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className='flex-1 h-11 min-w-[70px] animate-pulse flex items-center justify-center'
            >
              <div className='w-16 h-5 bg-gray-100 dark:bg-[#263244] rounded'></div>
            </div>
          ))}
        </div>
      </div>
      <div className='w-full h-64 rounded-lg bg-gray-50 dark:bg-[#1e2a3b] animate-pulse'></div>
    </div>
  );
}

// Export the component wrapped in Suspense
export function TranslationTabs(props: {
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
  onSourceLanguageChange: (code: string) => void;
}) {
  return (
    <React.Suspense fallback={<TranslationTabsFallback />}>
      <TranslationTabsClient {...props} />
    </React.Suspense>
  );
}
