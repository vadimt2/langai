'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TextTranslation from '@/components/text-translation';
import ImageTranslation from '@/components/image-translation';
import DocumentTranslation from '@/components/document-translation';
import LanguageControls from '@/components/language-controls';
import AudioTranslation from './audio-translation';
import { clearLanguagePreferences } from '@/app/actions/language-preferences';
import { Button } from './ui/button';
import { RotateCcw, Check } from 'lucide-react';
import { useLanguageWithConsent } from '@/app/hooks/use-language-with-consent';

// Loading component
function LoadingState() {
  return (
    <Card className='w-full max-w-3xl mx-auto'>
      <CardHeader>
        <CardTitle>Translate</CardTitle>
        <CardDescription>Loading your language preferences...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='h-64 flex items-center justify-center'>
          <div className='animate-pulse text-center'>
            <div className='h-12 w-32 bg-gray-200 rounded mx-auto mb-4'></div>
            <p className='text-gray-500'>Loading translation interface...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TranslationAppShell() {
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');

  // Use the consent-aware language hook
  const {
    sourceLanguage,
    targetLanguage,
    updateSourceLanguage,
    updateTargetLanguage,
    preferencesAllowed,
    isLoading,
  } = useLanguageWithConsent('en', 'es');

  // Show loading state while preferences are being loaded
  if (isLoading) {
    return <LoadingState />;
  }

  // Check if we have non-default preferences
  const preferencesLoaded = sourceLanguage !== 'en' || targetLanguage !== 'es';

  // Reset preferences handler
  async function handleResetPreferences() {
    // Clear cookies - this will trigger a revalidation in the server action
    const result = await clearLanguagePreferences();

    if (result.success) {
      // Reset local state
      updateSourceLanguage('en');
      updateTargetLanguage('es');
    }
  }

  // Language switching function
  function switchLanguages() {
    const tempSource = sourceLanguage;
    const tempTarget = targetLanguage;

    // Update both languages at once
    updateSourceLanguage(tempTarget);
    updateTargetLanguage(tempSource);
  }

  // Model change handler
  function handleModelChange(model: string) {
    setSelectedModel(model);
  }

  return (
    <Card className='w-full max-w-3xl mx-auto'>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <CardTitle>Translate</CardTitle>

          {preferencesLoaded && (
            <div className='flex items-center text-xs text-muted-foreground'>
              <Check className='h-3 w-3 mr-1' />
              <span>Preferences loaded</span>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleResetPreferences}
                className='ml-1 h-6 w-6'
                title='Reset to defaults'
              >
                <RotateCcw className='h-3 w-3' />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>
          Translate text or voice between any two languages
        </CardDescription>

        <LanguageControls
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          selectedModel={selectedModel}
          onSourceLanguageChange={updateSourceLanguage}
          onTargetLanguageChange={updateTargetLanguage}
          onModelChange={handleModelChange}
          onSwitchLanguages={switchLanguages}
        />
      </CardHeader>

      <CardContent>
        <TranslationTabs
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          model={selectedModel}
        />
      </CardContent>

      <CardFooter className='flex justify-between'>
        <p className='text-sm text-gray-500'>Powered by AI</p>
        <p className='text-xs text-muted-foreground'>
          {preferencesAllowed
            ? 'Your language preferences are saved automatically'
            : 'Language preferences not saved (consent required)'}
        </p>
      </CardFooter>
    </Card>
  );
}

function TranslationTabs({
  sourceLanguage,
  targetLanguage,
  model,
}: {
  sourceLanguage: string;
  targetLanguage: string;
  model: string;
}) {
  return (
    <Tabs defaultValue='text' className='w-full'>
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
