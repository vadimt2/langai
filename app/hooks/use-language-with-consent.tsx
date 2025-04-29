'use client';

import { useState, useEffect } from 'react';
import { useConsent } from '@/components/gdpr/consent-context';
import {
  getLanguagePreferences,
  saveSourceLanguage,
  saveTargetLanguage,
} from '@/app/actions/language-preferences';

/**
 * Hook to manage language preferences with GDPR consent integration.
 * Only saves preferences to cookies if the user has given consent.
 */
export function useLanguageWithConsent(
  defaultSource: string = 'en',
  defaultTarget: string = 'es'
) {
  // Initialize with defaults
  const [sourceLanguage, setSourceLanguage] = useState(defaultSource);
  const [targetLanguage, setTargetLanguage] = useState(defaultTarget);
  const [isLoading, setIsLoading] = useState(true);

  // Get consent status
  const { consentState } = useConsent();
  const preferencesAllowed = consentState.preferences;

  // Load initial preferences when component mounts and consent status is known
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      if (!preferencesAllowed) {
        if (isMounted) {
          setSourceLanguage(defaultSource);
          setTargetLanguage(defaultTarget);
          setIsLoading(false);
        }
        return;
      }

      try {
        const prefs = await getLanguagePreferences();
        if (isMounted) {
          setSourceLanguage(prefs.sourceLanguage || defaultSource);
          setTargetLanguage(prefs.targetLanguage || defaultTarget);
        }
      } catch (error) {
        console.error('Error fetching language preferences:', error);
        if (isMounted) {
          setSourceLanguage(defaultSource);
          setTargetLanguage(defaultTarget);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only trigger the effect if the component is mounted and we have consent status
    if (typeof preferencesAllowed !== 'undefined') {
      setIsLoading(true);
      loadPreferences();
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [preferencesAllowed, defaultSource, defaultTarget]);

  // Source language update with consent check
  const updateSourceLanguage = async (language: string) => {
    setSourceLanguage(language);

    if (preferencesAllowed) {
      try {
        await saveSourceLanguage(null, language);
      } catch (error) {
        console.error('Error saving source language:', error);
      }
    }
  };

  // Target language update with consent check
  const updateTargetLanguage = async (language: string) => {
    setTargetLanguage(language);

    if (preferencesAllowed) {
      try {
        await saveTargetLanguage(null, language);
      } catch (error) {
        console.error('Error saving target language:', error);
      }
    }
  };

  return {
    sourceLanguage,
    targetLanguage,
    updateSourceLanguage,
    updateTargetLanguage,
    preferencesAllowed,
    isLoading,
  };
}
