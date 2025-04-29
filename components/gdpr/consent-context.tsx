'use client';

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
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

// Create the context with default values
const ConsentContext = createContext<ConsentContextType>({
  consentState: defaultConsentState,
  updateConsent: () => {},
  acceptAll: () => {},
  acceptNecessaryOnly: () => {},
  showBanner: false,
  closeBanner: () => {},
  openBanner: () => {},
  openPreferences: () => {},
  showPreferences: false,
  savePreferences: () => {},
});

// Utility functions to handle cookies
function enableAnalyticsCookies() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }
}

function disableAnalyticsCookies() {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }
}

function enableMarketingCookies() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('consent', 'grant');
  }
}

function disableMarketingCookies() {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('consent', 'revoke');
  }
}

function enablePreferencesCookies() {
  document.cookie =
    'preferences_enabled=true;max-age=31536000;path=/;samesite=lax';

  window.dispatchEvent(
    new CustomEvent('preferences-consent-changed', {
      detail: { granted: true },
    })
  );
}

function disablePreferencesCookies() {
  document.cookie = 'preferences_enabled=false;max-age=0;path=/;samesite=lax';
  document.cookie = 'source-language=;max-age=0;path=/;samesite=lax';
  document.cookie = 'target-language=;max-age=0;path=/;samesite=lax';

  window.dispatchEvent(
    new CustomEvent('preferences-consent-changed', {
      detail: { granted: false },
    })
  );
}

// Apply consent preferences based on state
function applyConsentPreferences(state: ConsentState) {
  // For analytics
  if (state.analytics) {
    enableAnalyticsCookies();
  } else {
    disableAnalyticsCookies();
  }

  // For marketing
  if (state.marketing) {
    enableMarketingCookies();
  } else {
    disableMarketingCookies();
  }

  // For preferences
  if (state.preferences) {
    enablePreferencesCookies();
  } else {
    disablePreferencesCookies();
  }
}

// Helper to load consent from localStorage
function loadConsentFromStorage(): {
  state: ConsentState;
  showBanner: boolean;
} {
  // Skip during SSR
  if (typeof window === 'undefined') {
    return { state: defaultConsentState, showBanner: false };
  }

  const savedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
  const expiryDate = localStorage.getItem(EXPIRY_KEY);
  const now = new Date().getTime();

  // Check if consent has expired or doesn't exist
  if (!savedConsent || !expiryDate || now > parseInt(expiryDate, 10)) {
    return { state: defaultConsentState, showBanner: true };
  }

  try {
    const parsedConsent = JSON.parse(savedConsent) as ConsentState;
    return { state: parsedConsent, showBanner: false };
  } catch (error) {
    console.error('Error parsing consent data:', error);
    return { state: defaultConsentState, showBanner: true };
  }
}

// Helper to save consent to localStorage
function saveConsentToStorage(state: ConsentState): void {
  // Skip during SSR or when the user hasn't interacted
  if (typeof window === 'undefined' || !state.hasInteracted) return;

  try {
    const now = new Date().getTime();
    const expiryTime = now + EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(EXPIRY_KEY, expiryTime.toString());

    // Apply the preferences
    applyConsentPreferences(state);
  } catch (error) {
    console.error('Error saving consent preferences:', error);
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  // Since we can't use state initially with localStorage, use refs for initial value
  const isInitialized = useRef(false);

  // Initialize state with default values
  const [consentState, setConsentState] =
    useState<ConsentState>(defaultConsentState);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // We still need useEffect for client-side initialization with localStorage
  useEffect(() => {
    if (!isInitialized.current) {
      const { state, showBanner: shouldShowBanner } = loadConsentFromStorage();
      setConsentState(state);
      setShowBanner(shouldShowBanner);
      isInitialized.current = true;
    }
  }, []);

  // Save consent when it changes
  useEffect(() => {
    if (isInitialized.current && consentState.hasInteracted) {
      saveConsentToStorage(consentState);
    }
  }, [consentState]);

  // Update a single consent category
  function updateConsent(
    category: Exclude<ConsentCategory, 'necessary'>,
    value: boolean
  ) {
    setConsentState((prev) => ({
      ...prev,
      [category]: value,
    }));
  }

  // Accept all cookie categories
  function acceptAll() {
    setConsentState({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
      hasInteracted: true,
    });
    setShowBanner(false);
    setShowPreferences(false);
  }

  // Accept only necessary cookies
  function acceptNecessaryOnly() {
    setConsentState({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
      hasInteracted: true,
    });
    setShowBanner(false);
    setShowPreferences(false);
  }

  // Banner controls
  function closeBanner() {
    setShowBanner(false);
  }

  function openBanner() {
    setShowBanner(true);
  }

  // Preferences modal controls
  function openPreferences(open: boolean = true) {
    setShowPreferences(open);
    if (open) {
      setShowBanner(false);
    }
  }

  function savePreferences() {
    setConsentState((prev) => ({
      ...prev,
      hasInteracted: true,
    }));
    setShowPreferences(false);
  }

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
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}

// Declare global window interface extensions
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}
