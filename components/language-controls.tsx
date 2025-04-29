'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageDropdown } from '@/components/language-dropdown';
import { languages } from '@/data/languages';
import { useLanguageWithConsent } from '@/app/hooks/use-language-with-consent';
import type { Language } from '@/data/languages';

interface LanguageControlsProps {
  sourceLanguage: string;
  targetLanguage: string;
  selectedModel: string;
  onSourceLanguageChange: (code: string) => void;
  onTargetLanguageChange: (code: string) => void;
  onModelChange: (model: string) => void;
  onSwitchLanguages: () => void;
}

export default function LanguageControls({
  sourceLanguage,
  targetLanguage,
  selectedModel,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onModelChange,
  onSwitchLanguages,
}: LanguageControlsProps) {
  // Initialize the consent-aware language hook
  const { updateSourceLanguage, updateTargetLanguage, preferencesAllowed } =
    useLanguageWithConsent(sourceLanguage, targetLanguage);

  // Filter language lists
  const sourceLanguageOptions = languages.filter(
    (lang) => lang.code !== targetLanguage
  );

  const targetLanguageOptions = languages.filter(
    (lang) => lang.code !== sourceLanguage && lang.code !== 'auto'
  );

  // Handler for source language selection
  async function handleSourceLanguageSelect(language: Language) {
    const languageCode = language.code;
    onSourceLanguageChange(languageCode);

    // Don't save 'auto' to preferences
    if (languageCode !== 'auto') {
      // Save preference using consent-aware hook
      await updateSourceLanguage(languageCode);
    }
  }

  // Handler for target language selection
  async function handleTargetLanguageSelect(language: Language) {
    const languageCode = language.code;
    onTargetLanguageChange(languageCode);

    // Save preference using consent-aware hook
    await updateTargetLanguage(languageCode);
  }

  // Handle language switch with cookie persistence
  async function handleSwitchLanguages() {
    onSwitchLanguages();

    // After switching languages in the UI, also update cookies
    // We do this with a slight delay to ensure state has been updated
    setTimeout(async () => {
      // The state will be flipped at this point
      if (preferencesAllowed) {
        // Update both languages separately since updateLanguages is no longer available
        await updateSourceLanguage(targetLanguage);
        await updateTargetLanguage(sourceLanguage);
      }
    }, 10);
  }

  return (
    <div className='mt-4'>
      {/* Desktop and tablet view - horizontal layout with grid */}
      <div className='hidden sm:block'>
        <div className='space-y-6'>
          <div className='grid grid-cols-5 gap-2'>
            <div className='col-span-2'>
              <div className='mb-1.5'>From</div>
              <LanguageDropdown
                defaultValue={sourceLanguage}
                onChange={handleSourceLanguageSelect}
                placeholder='Select language'
                options={sourceLanguageOptions}
              />
            </div>

            <div className='flex items-end justify-center'>
              <Button
                variant='outline'
                size='icon'
                onClick={handleSwitchLanguages}
                className='rounded-full h-10 w-10 bg-background shadow-md border-2'
                aria-label='Switch languages'
              >
                <ArrowLeftRight className='h-5 w-5' />
              </Button>
            </div>

            <div className='col-span-2'>
              <div className='mb-1.5'>To</div>
              <LanguageDropdown
                defaultValue={targetLanguage}
                onChange={handleTargetLanguageSelect}
                placeholder='Select language'
                options={targetLanguageOptions}
              />
            </div>
          </div>

          {/* <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} id="model-selector" /> */}
        </div>
      </div>

      {/* Mobile view - vertical layout */}
      <div className='sm:hidden space-y-4'>
        <div>
          <div className='mb-1.5'>From</div>
          <LanguageDropdown
            defaultValue={sourceLanguage}
            onChange={handleSourceLanguageSelect}
            placeholder='Select language'
            options={sourceLanguageOptions}
          />
        </div>

        <div className='flex justify-center'>
          <Button
            variant='outline'
            size='icon'
            onClick={handleSwitchLanguages}
            className='rounded-full h-10 w-10 bg-background shadow-md border-2'
            aria-label='Switch languages'
          >
            <ArrowLeftRight className='h-5 w-5' />
          </Button>
        </div>

        <div>
          <div className='mb-1.5'>To</div>
          <LanguageDropdown
            defaultValue={targetLanguage}
            onChange={handleTargetLanguageSelect}
            placeholder='Select language'
            options={targetLanguageOptions}
          />
        </div>

        {/* <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} id="model-selector-mobile" /> */}
      </div>
    </div>
  );
}

function ModelSelector({
  selectedModel,
  onModelChange,
  id,
}: {
  selectedModel: string;
  onModelChange: (model: string) => void;
  id: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>Model</Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder='Select model' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='gpt-4-turbo'>
            GPT-4 Turbo (High Quality)
          </SelectItem>
          <SelectItem value='gpt-3.5-turbo'>GPT-3.5 Turbo (Faster)</SelectItem>
        </SelectContent>
      </Select>
      <p className='text-xs text-gray-500 mt-1'>
        Select a model based on your translation needs
      </p>
    </div>
  );
}
