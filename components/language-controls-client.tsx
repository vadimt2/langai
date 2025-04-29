'use client';

import { useState } from 'react';
import LanguageControls from '@/components/language-controls';

interface LanguageControlsClientProps {
  initialSourceLanguage: string;
  initialTargetLanguage: string;
}

export function LanguageControlsClient({
  initialSourceLanguage,
  initialTargetLanguage,
}: LanguageControlsClientProps) {
  // Internal state for client-side handling
  const [sourceLanguage, setSourceLanguage] = useState(initialSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLanguage);
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');

  // Client-side handlers that don't cause serialization issues
  const handleSourceLanguageChange = (code: string) => {
    setSourceLanguage(code);
  };

  const handleTargetLanguageChange = (code: string) => {
    setTargetLanguage(code);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSwitchLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  return (
    <LanguageControls
      sourceLanguage={sourceLanguage}
      targetLanguage={targetLanguage}
      selectedModel={selectedModel}
      onSourceLanguageChange={handleSourceLanguageChange}
      onTargetLanguageChange={handleTargetLanguageChange}
      onModelChange={handleModelChange}
      onSwitchLanguages={handleSwitchLanguages}
    />
  );
}
