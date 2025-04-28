"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import VoiceTranslation from "./voice-translation"
import AudioFileTranslation from "./audio-file-translation"
import { Mic, FileAudio } from "lucide-react"

interface AudioTranslationProps {
  sourceLanguage: string
  targetLanguage: string
  model?: string
}

export default function AudioTranslation({
  sourceLanguage,
  targetLanguage,
  model = "gpt-3.5-turbo",
}: AudioTranslationProps) {
  const [activeTab, setActiveTab] = useState("voice")

  return (
    <Tabs defaultValue="voice" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="voice" className="flex items-center">
          <Mic className="mr-2 h-4 w-4" />
          Voice Recording
        </TabsTrigger>
        <TabsTrigger value="file" className="flex items-center">
          <FileAudio className="mr-2 h-4 w-4" />
          Audio File
        </TabsTrigger>
      </TabsList>

      <TabsContent value="voice">
        <VoiceTranslation sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={model} />
      </TabsContent>

      <TabsContent value="file">
        <AudioFileTranslation sourceLanguage={sourceLanguage} targetLanguage={targetLanguage} model={model} />
      </TabsContent>
    </Tabs>
  )
}
