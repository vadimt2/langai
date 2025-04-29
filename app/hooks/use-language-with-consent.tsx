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
      // Always start with the default values passed in as props
      if (isMounted) {
        setSourceLanguage(defaultSource);
        setTargetLanguage(defaultTarget);
      }

      // Don't try to load from cookies if preferences are not allowed
      if (!preferencesAllowed) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const prefs = await getLanguagePreferences();
        if (isMounted) {
          // Only update if we got valid preferences and they differ from defaults
          if (prefs.sourceLanguage) {
            setSourceLanguage(prefs.sourceLanguage);
          }
          if (prefs.targetLanguage) {
            setTargetLanguage(prefs.targetLanguage);
          }
        }
      } catch (error) {
        console.error('Error fetching language preferences:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only trigger the effect if the component is mounted and we have consent status
    if (typeof preferencesAllowed !== 'undefined') {
      loadPreferences();
    } else {
      // If consent state isn't available yet, at least stop loading
      setIsLoading(false);
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
