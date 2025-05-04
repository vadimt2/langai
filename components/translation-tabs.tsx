'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TextTranslation from '@/components/text-translation';
import ImageTranslation from '@/components/image-translation';
import DocumentTranslation from '@/components/document-translation';
import AudioTranslation from './audio-translation';

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
      <TabsList className='grid w-full grid-cols-4'>
        <TabsTrigger value='text'>Text</TabsTrigger>
        <TabsTrigger value='voice'>Voice</TabsTrigger>
        <TabsTrigger value='image'>Image</TabsTrigger>
        <TabsTrigger value='document'>Document</TabsTrigger>
      </TabsList>

      <TabsContent value='text'>
        <TextTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
          onSourceLanguageChange={onSourceLanguageChange}
        />
      </TabsContent>

      <TabsContent value='voice' className='mt-0'>
        <AudioTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
        />
      </TabsContent>

      <TabsContent value='image'>
        <ImageTranslation
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={model}
        />
      </TabsContent>

      <TabsContent value='document'>
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
      <div className='grid w-full grid-cols-4 gap-2 bg-muted/30 p-1 rounded-lg'>
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className='h-9 rounded bg-accent/10 animate-pulse'
          ></div>
        ))}
      </div>
      <div className='w-full h-64 rounded-lg bg-accent/5 animate-pulse'></div>
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
