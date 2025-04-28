"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TextTranslation from "@/components/text-translation"
import ImageTranslation from "@/components/image-translation"
import DocumentTranslation from "@/components/document-translation"
import LanguageControls from "@/components/language-controls"
import AudioTranslation from "./audio-translation"

export default function TranslationAppShell() {
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo")

  // Optimize the language switching function
  const switchLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
  }, [sourceLanguage, targetLanguage])

  // Optimize the language change handlers
  const handleSourceLanguageChange = useCallback((code: string) => {
    setSourceLanguage(code)
  }, [])

  const handleTargetLanguageChange = useCallback((code: string) => {
    setTargetLanguage(code)
  }, [])

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model)
  }, [])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Translate</CardTitle>
        <CardDescription>Translate text or voice between any two languages</CardDescription>

        <LanguageControls
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          selectedModel={selectedModel}
          onSourceLanguageChange={handleSourceLanguageChange}
          onTargetLanguageChange={handleTargetLanguageChange}
          onModelChange={handleModelChange}
          onSwitchLanguages={switchLanguages}
        />
      </CardHeader>

      <CardContent>
        <TranslationTabs sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={selectedModel} />
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">Powered by AI</p>
      </CardFooter>
    </Card>
  )
}

function TranslationTabs({
  sourceLanguage,
  targetLanguage,
  model,
}: {
  sourceLanguage: string
  targetLanguage: string
  model: string
}) {
  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="text">Text</TabsTrigger>
        <TabsTrigger value="voice">Voice</TabsTrigger>
        <TabsTrigger value="image">Image</TabsTrigger>
        <TabsTrigger value="document">Document</TabsTrigger>
      </TabsList>

      <TabsContent value="text">
        <TextTranslation sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={model} />
      </TabsContent>

      <TabsContent value="voice" className="mt-0">
        <AudioTranslation sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={model} />
      </TabsContent>

      <TabsContent value="image">
        <ImageTranslation sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={model} />
      </TabsContent>

      <TabsContent value="document">
        <DocumentTranslation sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={model} />
      </TabsContent>
    </Tabs>
  )
}
