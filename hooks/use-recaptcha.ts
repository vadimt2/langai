"use client"

import { useState, useEffect, useCallback } from "react"

// Define the window interface to include the recaptcha object
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

export function useRecaptcha() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDisabled, setIsDisabled] = useState(false)

  // Load the reCAPTCHA script
  useEffect(() => {
    // Skip if already loaded or loading
    if (isLoaded || isLoading || typeof window === "undefined") return

    // Check if reCAPTCHA is disabled with a single variable
    const disableRecaptcha = process.env.NEXT_PUBLIC_DISABLE_RECAPTCHA === "true"

    if (disableRecaptcha) {
      console.log("reCAPTCHA is disabled by configuration")
      setIsDisabled(true)
      setIsLoaded(true)
      return
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    if (!siteKey) {
      setError("reCAPTCHA site key is not configured")
      return
    }

    // Check if already loaded
    if (window.grecaptcha) {
      setIsLoaded(true)
      return
    }

    setIsLoading(true)

    // Create script element
    const script = document.createElement("script")
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true

    // Handle script load events
    script.onload = () => {
      window.grecaptcha.ready(() => {
        setIsLoaded(true)
        setIsLoading(false)
      })
    }

    script.onerror = () => {
      setError("Failed to load reCAPTCHA")
      setIsLoading(false)
    }

    // Add script to document
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      // Only remove the script if we added it
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [isLoaded, isLoading])

  // Function to get a token for a specific action
  const getToken = useCallback(
    async (action: string): Promise<string | null> => {
      // If reCAPTCHA is disabled, return a dummy token
      if (isDisabled) {
        console.log(`reCAPTCHA disabled: Returning dummy token for action: ${action}`)
        return "recaptcha-disabled-dummy-token"
      }

      if (!isLoaded) {
        setError("reCAPTCHA is not loaded yet")
        return null
      }

      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      if (!siteKey) {
        setError("reCAPTCHA site key is not configured")
        return null
      }

      try {
        const token = await window.grecaptcha.execute(siteKey, { action })
        return token
      } catch (err) {
        setError(`Failed to execute reCAPTCHA: ${err instanceof Error ? err.message : String(err)}`)
        return null
      }
    },
    [isLoaded, isDisabled],
  )

  return {
    isLoaded,
    isLoading,
    error,
    getToken,
    isDisabled,
  }
}
