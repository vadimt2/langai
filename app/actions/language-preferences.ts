'use server';

import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

// Constants
const SOURCE_LANGUAGE_COOKIE = 'source-language';
const TARGET_LANGUAGE_COOKIE = 'target-language';
const COOKIE_EXPIRY = 60 * 60 * 24 * 365; // 1 year in seconds
const DEFAULT_SOURCE_LANGUAGE = 'en';
const DEFAULT_TARGET_LANGUAGE = 'es';
const LANGUAGE_CACHE_TAG = 'language-preferences';

// Type for language preferences
export type LanguagePreferences = {
  sourceLanguage: string;
  targetLanguage: string;
};

/**
 * Check if preferences cookies are allowed based on client-side consent
 */
async function arePreferenceCookiesAllowed(
  requestHeaders?: Headers
): Promise<boolean> {
  // Check cookie store directly if no headers provided
  if (!requestHeaders) {
    const cookieStore = await cookies();
    const preferencesEnabled = cookieStore.get('preferences_enabled')?.value;
    return preferencesEnabled === 'true';
  }

  // Read the consent cookie directly from request headers
  const cookieHeader = requestHeaders.get('cookie') || '';
  const consentCookieMatch = cookieHeader.match(/gdpr-consent=([^;]+)/);
  const preferencesEnabledMatch = cookieHeader.match(
    /preferences_enabled=([^;]+)/
  );

  // Check for preferences_enabled cookie first
  if (preferencesEnabledMatch && preferencesEnabledMatch[1] === 'true') {
    return true;
  }

  // Fall back to gdpr-consent cookie
  if (!consentCookieMatch) {
    return false; // No consent cookie found
  }

  try {
    const consentData = JSON.parse(decodeURIComponent(consentCookieMatch[1]));
    return consentData.preferences === true;
  } catch (error) {
    console.error('Error parsing consent cookie:', error);
    return false;
  }
}

/**
 * Save the source language preference to cookies if consent is granted
 */
export async function saveSourceLanguage(
  formData: FormData | null,
  languageCode: string,
  requestHeaders?: Headers
): Promise<{ success: boolean }> {
  'use server';

  // Support form submissions or direct calls
  const code = formData
    ? (formData.get('languageCode') as string)
    : languageCode;

  // Skip saving if consent not granted
  if (!(await arePreferenceCookiesAllowed(requestHeaders))) {
    console.log('Preference cookies not allowed. Source language not saved.');
    return { success: false };
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(SOURCE_LANGUAGE_COOKIE, code, {
      maxAge: COOKIE_EXPIRY,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Revalidate using tag for better dynamic support
    revalidateTag(LANGUAGE_CACHE_TAG);
    return { success: true };
  } catch (error) {
    console.error('Error saving source language:', error);
    return { success: false };
  }
}

/**
 * Save the target language preference to cookies if consent is granted
 */
export async function saveTargetLanguage(
  formData: FormData | null,
  languageCode: string,
  requestHeaders?: Headers
): Promise<{ success: boolean }> {
  'use server';

  // Support form submissions or direct calls
  const code = formData
    ? (formData.get('languageCode') as string)
    : languageCode;

  // Skip saving if consent not granted
  if (!(await arePreferenceCookiesAllowed(requestHeaders))) {
    console.log('Preference cookies not allowed. Target language not saved.');
    return { success: false };
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(TARGET_LANGUAGE_COOKIE, code, {
      maxAge: COOKIE_EXPIRY,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Revalidate using tag for better dynamic support
    revalidateTag(LANGUAGE_CACHE_TAG);
    return { success: true };
  } catch (error) {
    console.error('Error saving target language:', error);
    return { success: false };
  }
}

/**
 * Get the source language from cookies
 */
export async function getSourceLanguage(
  requestHeaders?: Headers
): Promise<string> {
  // Return default if consent not granted
  if (!(await arePreferenceCookiesAllowed(requestHeaders))) {
    return DEFAULT_SOURCE_LANGUAGE;
  }

  try {
    const cookieStore = await cookies();
    const languageCookie = cookieStore.get(SOURCE_LANGUAGE_COOKIE);
    return languageCookie?.value || DEFAULT_SOURCE_LANGUAGE;
  } catch (error) {
    console.error('Error getting source language:', error);
    return DEFAULT_SOURCE_LANGUAGE;
  }
}

/**
 * Get the target language from cookies
 */
export async function getTargetLanguage(
  requestHeaders?: Headers
): Promise<string> {
  // Return default if consent not granted
  if (!(await arePreferenceCookiesAllowed(requestHeaders))) {
    return DEFAULT_TARGET_LANGUAGE;
  }

  try {
    const cookieStore = await cookies();
    const languageCookie = cookieStore.get(TARGET_LANGUAGE_COOKIE);
    return languageCookie?.value || DEFAULT_TARGET_LANGUAGE;
  } catch (error) {
    console.error('Error getting target language:', error);
    return DEFAULT_TARGET_LANGUAGE;
  }
}

/**
 * Save both source and target languages at once
 */
export async function saveLanguagePreferences(
  formData: FormData | null,
  sourceLanguage: string,
  targetLanguage: string,
  requestHeaders?: Headers
): Promise<{ success: boolean }> {
  'use server';

  try {
    // Support form submissions or direct calls
    const source = formData
      ? (formData.get('sourceLanguage') as string)
      : sourceLanguage;
    const target = formData
      ? (formData.get('targetLanguage') as string)
      : targetLanguage;

    const sourceResult = await saveSourceLanguage(null, source, requestHeaders);
    const targetResult = await saveTargetLanguage(null, target, requestHeaders);

    return {
      success: sourceResult.success && targetResult.success,
    };
  } catch (error) {
    console.error('Error saving language preferences:', error);
    return { success: false };
  }
}

/**
 * Clear language preferences
 */
export async function clearLanguagePreferences(
  _formData?: FormData
): Promise<{ success: boolean }> {
  'use server';

  try {
    const cookieStore = await cookies();
    cookieStore.delete(SOURCE_LANGUAGE_COOKIE);
    cookieStore.delete(TARGET_LANGUAGE_COOKIE);

    // Revalidate using tag for better dynamic support
    revalidateTag(LANGUAGE_CACHE_TAG);
    return { success: true };
  } catch (error) {
    console.error('Error clearing language preferences:', error);
    return { success: false };
  }
}

/**
 * Get both source and target language preferences
 */
export async function getLanguagePreferences(
  requestHeaders?: Headers
): Promise<LanguagePreferences> {
  try {
    const sourceLanguage = await getSourceLanguage(requestHeaders);
    const targetLanguage = await getTargetLanguage(requestHeaders);

    return {
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    console.error('Error getting language preferences:', error);
    return {
      sourceLanguage: DEFAULT_SOURCE_LANGUAGE,
      targetLanguage: DEFAULT_TARGET_LANGUAGE,
    };
  }
}
