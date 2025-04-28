"use client"

import { useRecaptchaContext } from "@/context/recaptcha-context"
import { AlertCircle, CheckCircle, Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function RecaptchaStatus() {
  const { isLoaded, isLoading, error, isDisabled } = useRecaptchaContext()

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  if (isDisabled) {
    return (
      <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle>reCAPTCHA Disabled</AlertTitle>
        <AlertDescription>reCAPTCHA is currently disabled. Set DISABLE_RECAPTCHA=false to enable it.</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>reCAPTCHA Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Alert className="mt-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Loading reCAPTCHA</AlertTitle>
        <AlertDescription>Please wait while reCAPTCHA is being loaded...</AlertDescription>
      </Alert>
    )
  }

  if (isLoaded) {
    return (
      <Alert className="mt-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle>reCAPTCHA Loaded</AlertTitle>
        <AlertDescription>reCAPTCHA is loaded and ready to use.</AlertDescription>
      </Alert>
    )
  }

  return null
}
