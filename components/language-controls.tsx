"use client"

import { useMemo, useCallback, memo } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageDropdown } from "@/components/language-dropdown"
import { languages } from "@/data/languages"

interface LanguageControlsProps {
  sourceLanguage: string
  targetLanguage: string
  selectedModel: string
  onSourceLanguageChange: (code: string) => void
  onTargetLanguageChange: (code: string) => void
  onModelChange: (model: string) => void
  onSwitchLanguages: () => void
}

export default function LanguageControls({
  sourceLanguage,
  targetLanguage,
  selectedModel,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onModelChange,
  onSwitchLanguages,
}: LanguageControlsProps) {
  // Memoize filtered language lists to prevent recalculation on every render
  const sourceLanguageOptions = useMemo(
    () => languages.filter((lang) => lang.code !== targetLanguage),
    [targetLanguage],
  )

  const targetLanguageOptions = useMemo(
    () => languages.filter((lang) => lang.code !== sourceLanguage),
    [sourceLanguage],
  )

  // Memoize handlers
  const handleSourceLanguageSelect = useCallback(
    (language: any) => onSourceLanguageChange(language.code),
    [onSourceLanguageChange],
  )

  const handleTargetLanguageSelect = useCallback(
    (language: any) => onTargetLanguageChange(language.code),
    [onTargetLanguageChange],
  )

  return (
    <div className="mt-4">
      {/* Desktop and tablet view - horizontal layout with grid */}
      <div className="hidden sm:block">
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-2">
              <div className="mb-1.5">From</div>
              <LanguageDropdown
                defaultValue={sourceLanguage}
                onChange={handleSourceLanguageSelect}
                placeholder="Select language"
                options={sourceLanguageOptions}
              />
            </div>

            <div className="flex items-end justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={onSwitchLanguages}
                className="rounded-full h-10 w-10 bg-background shadow-md border-2"
                aria-label="Switch languages"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="col-span-2">
              <div className="mb-1.5">To</div>
              <LanguageDropdown
                defaultValue={targetLanguage}
                onChange={handleTargetLanguageSelect}
                placeholder="Select language"
                options={targetLanguageOptions}
              />
            </div>
          </div>

          {/* <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} id="model-selector" /> */}
        </div>
      </div>

      {/* Mobile view - vertical layout */}
      <div className="sm:hidden space-y-4">
        <div>
          <div className="mb-1.5">From</div>
          <LanguageDropdown
            defaultValue={sourceLanguage}
            onChange={handleSourceLanguageSelect}
            placeholder="Select language"
            options={sourceLanguageOptions}
          />
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={onSwitchLanguages}
            className="rounded-full h-10 w-10 bg-background shadow-md border-2"
            aria-label="Switch languages"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>
        </div>

        <div>
          <div className="mb-1.5">To</div>
          <LanguageDropdown
            defaultValue={targetLanguage}
            onChange={handleTargetLanguageSelect}
            placeholder="Select language"
            options={targetLanguageOptions}
          />
        </div>

        {/* <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} id="model-selector-mobile" /> */}
      </div>
    </div>
  )
}

const ModelSelector = memo(function ModelSelector({
  selectedModel,
  onModelChange,
  id,
}: {
  selectedModel: string
  onModelChange: (model: string) => void
  id: string
}) {
  return (
    <div>
      <Label htmlFor={id}>Model</Label>
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4-turbo">GPT-4 Turbo (High Quality)</SelectItem>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500 mt-1">Select a model based on your translation needs</p>
    </div>
  )
})
