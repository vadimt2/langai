"use client"

import { memo, useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { LanguageDropdown } from "@/components/language-dropdown"
import type { Language } from "@/data/languages"
import { languages } from "@/data/languages" // Import the languages array

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
  label: string
  disabledValue?: string
}

function LanguageSelectorComponent({ value, onChange, label, disabledValue }: LanguageSelectorProps) {
  // Memoize the language change handler
  const handleLanguageChange = useCallback(
    (language: Language) => {
      onChange(language.code)
    },
    [onChange],
  )

  // Filter languages only once and memoize the result
  const filteredOptions = useMemo(() => {
    if (!disabledValue) return languages
    return languages.filter((lang) => lang.code !== disabledValue)
  }, [disabledValue])

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <Label htmlFor={`language-${label}`}>{label}</Label>
      <LanguageDropdown
        defaultValue={value}
        onChange={handleLanguageChange}
        placeholder={`Select ${label.toLowerCase()} language`}
        options={filteredOptions}
      />
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(LanguageSelectorComponent)
