"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useRecaptcha } from "@/hooks/use-recaptcha"

interface RecaptchaContextType {
  isLoaded: boolean
  isLoading: boolean
  error: string | null
  isDisabled: boolean
  getToken: (action: string) => Promise<string | null>
}

const RecaptchaContext = createContext<RecaptchaContextType | undefined>(undefined)

export function RecaptchaProvider({ children }: { children: ReactNode }) {
  const recaptcha = useRecaptcha()

  return <RecaptchaContext.Provider value={recaptcha}>{children}</RecaptchaContext.Provider>
}

export function useRecaptchaContext() {
  const context = useContext(RecaptchaContext)
  if (context === undefined) {
    throw new Error("useRecaptchaContext must be used within a RecaptchaProvider")
  }
  return context
}
