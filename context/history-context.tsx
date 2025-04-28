"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"

export interface TranslationItem {
  id: string
  sourceLanguage: string
  targetLanguage: string
  sourceText: string
  translatedText: string
  timestamp: string
  mode: "text" | "voice"
}

interface HistoryContextType {
  history: TranslationItem[]
  addToHistory: (item: Omit<TranslationItem, "id">) => void
  clearHistory: () => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<TranslationItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("translationHistory")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error("Failed to parse history from localStorage", error)
      }
    }
  }, [])

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("translationHistory", JSON.stringify(history))
  }, [history])

  const addToHistory = (item: Omit<TranslationItem, "id">) => {
    const newItem = {
      ...item,
      id: uuidv4(),
    }

    setHistory((prev) => [newItem, ...prev].slice(0, 50)) // Keep only the last 50 items
  }

  const clearHistory = () => {
    setHistory([])
  }

  return <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>{children}</HistoryContext.Provider>
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider")
  }
  return context
}
