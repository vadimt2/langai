'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

// Define the consent categories
export type ConsentCategory =
  | 'necessary'
  | 'analytics'
  | 'marketing'
  | 'preferences';

// Define the consent state structure
export interface ConsentState {
  necessary: boolean; // Always true, can't be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  hasInteracted: boolean; // Whether the user has made a choice
}

// Define context interface
interface ConsentContextType {
  consentState: ConsentState;
  updateConsent: (
    category: Exclude<ConsentCategory, 'necessary'>,
    value: boolean
  ) => void;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  showBanner: boolean;
  closeBanner: () => void;
  openBanner: () => void;
  openPreferences: (open?: boolean) => void;
  showPreferences: boolean;
  savePreferences: () => void;
}

// Create the context with a default value
const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

// Default consent state
const defaultConsentState: ConsentState = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
  hasInteracted: false,
};

// LocalStorage key for consent
const CONSENT_STORAGE_KEY = 'gdpr-consent';
const EXPIRY_KEY = 'cookie-consent-expiry';
const EXPIRY_DAYS = 180; // 6 months

export function ConsentProvider({ children }: { children: ReactNode }) {
  // State for user consent
  const [consentState, setConsentState] =
    useState<ConsentState>(defaultConsentState);

  // UI control states
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Load saved consent from localStorage on mount
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;

    const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    const expiryDate = localStorage.getItem(EXPIRY_KEY);

    const now = new Date().getTime();

    // Check if consent has expired or doesn't exist
    if (!savedConsent || !expiryDate || now > parseInt(expiryDate, 10)) {
      setShowBanner(true);
      return;
    }

    try {
      const parsedConsent = JSON.parse(savedConsent) as ConsentState;
      setConsentState(parsedConsent);
      setShowBanner(false);
    } catch (error) {
      console.error('Error parsing consent data:', error);
      setShowBanner(true);
    }
  }, []);

  // Save consent to localStorage whenever it changes
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined' || !consentState.hasInteracted) return;

    try {
      const now = new Date().getTime();
      const expiryTime = now + EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentState));
      localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

      // Execute consent logic for each category
      applyConsentPreferences(consentState);
    } catch (error) {
      console.error('Error saving consent preferences:', error);
    }
  }, [consentState]);

  // Apply the consent preferences (enable/disable cookies)
  const applyConsentPreferences = useCallback((state: ConsentState) => {
    // Always keep necessary cookies

    // For analytics (like Google Analytics)
    if (state.analytics) {
      // Enable analytics cookies/scripts
      enableAnalyticsCookies();
    } else {
      // Disable analytics cookies/scripts
      disableAnalyticsCookies();
    }

    // For marketing
    if (state.marketing) {
      // Enable marketing cookies/scripts
      enableMarketingCookies();
    } else {
      // Disable marketing cookies/scripts
      disableMarketingCookies();
    }

    // For preferences/functional
    if (state.preferences) {
      // Enable preferences cookies
      enablePreferencesCookies();
    } else {
      // Disable preferences cookies
      disablePreferencesCookies();
    }
  }, []);

  // Update a single consent category
  const updateConsent = useCallback(
    (category: Exclude<ConsentCategory, 'necessary'>, value: boolean) => {
      setConsentState((prev) => ({
        ...prev,
        [category]: value,
      }));
    },
    []
  );

  // Accept all cookie categories
  const acceptAll = useCallback(() => {
    setConsentState({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      hasInteracted: true,
    });
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  // Accept only necessary cookies
  const acceptNecessaryOnly = useCallback(() => {
    setConsentState({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      hasInteracted: true,
    });
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  // Close the banner without changing preferences
  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Open the banner explicitly
  const openBanner = useCallback(() => {
    setShowBanner(true);
  }, []);

  // Open/close the preferences modal
  const openPreferences = useCallback((open: boolean = true) => {
    setShowPreferences(open);
    if (open) {
      setShowBanner(false);
    }
  }, []);

  // Save preferences from the preferences modal
  const savePreferences = useCallback(() => {
    setConsentState((prev) => ({
      ...prev,
      hasInteracted: true,
    }));
    setShowPreferences(false);
  }, []);

  // Provide the context value
  const contextValue: ConsentContextType = {
    consentState,
    updateConsent,
    acceptAll,
    acceptNecessaryOnly,
    showBanner,
    closeBanner,
    openBanner,
    openPreferences,
    showPreferences,
    savePreferences,
  };

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
    </ConsentContext.Provider>
  );
}

// Custom hook to use the consent context
export function useConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}

// Utility functions to handle cookies

function enableAnalyticsCookies() {
  // Enable Google Analytics or similar
  if (typeof window !== 'undefined' && window.gtag) {
    // Example: Update Google Analytics consent
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}

function disableAnalyticsCookies() {
  // Disable Google Analytics or similar
  if (typeof window !== 'undefined' && window.gtag) {
    // Example: Update Google Analytics consent
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
}

function enableMarketingCookies() {
  // Enable marketing cookies (e.g., Facebook Pixel)
  if (typeof window !== 'undefined' && window.fbq) {
    // Facebook Pixel example
    window.fbq('consent', 'grant');
  }
}

function disableMarketingCookies() {
  // Disable marketing cookies
  if (typeof window !== 'undefined' && window.fbq) {
    // Facebook Pixel example
    window.fbq('consent', 'revoke');
  }
}

function enablePreferencesCookies() {
  // Enable preferences cookies
  // Usually just set a flag in localStorage or cookie
}

function disablePreferencesCookies() {
  // Disable preferences cookies
  // Usually just remove specific cookies
}

// Declare global window interface extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}
