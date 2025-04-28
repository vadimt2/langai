"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Play, Loader2, Save, FileAudio } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useHistory } from "@/context/history-context"
import { useRecaptchaContext } from "@/context/recaptcha-context"
import { Progress } from "@/components/ui/progress"

interface AudioFileTranslationProps {
  sourceLanguage: string
  targetLanguage: string
  model?: string
}

export default function AudioFileTranslation({
  sourceLanguage,
  targetLanguage,
  model = "gpt-3.5-turbo",
}: AudioFileTranslationProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [extractedText, setExtractedText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const { toast } = useToast()
  const { addToHistory } = useHistory()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { getToken, isLoaded: recaptchaLoaded, isDisabled } = useRecaptchaContext()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check if file is an audio file
    if (!selectedFile.type.startsWith("audio/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an audio file (MP3, WAV, etc.)",
        variant: "destructive",
      })
      return
    }

    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Audio file must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setExtractedText("")
    setTranslatedText("")
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const processAudioFile = async () => {
    if (!file) return

    setIsProcessing(true)
    setProcessingProgress(0)
    setExtractedText("")

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("sourceLanguage", sourceLanguage)

      // Get reCAPTCHA token
      let recaptchaToken = null
      if (recaptchaLoaded) {
        recaptchaToken = await getToken("extract_audio")
      }
      if (recaptchaToken) {
        formData.append("recaptchaToken", recaptchaToken)
      }

      // Simulate progress (since we can't get real progress from the API)
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 1000)

      const response = await fetch("/api/extract-audio", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process audio file")
      }

      const data = await response.json()
      setExtractedText(data.text)

      toast({
        title: "Audio Processed",
        description: "Text has been extracted from your audio file",
      })
    } catch (error) {
      console.error("Audio processing error:", error)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process audio file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTranslate = async () => {
    if (!extractedText.trim()) return

    setIsTranslating(true)
    setTranslatedText("")

    try {
      // Get reCAPTCHA token
      let recaptchaToken = null
      if (recaptchaLoaded) {
        recaptchaToken = await getToken("translate")
      }

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: extractedText,
          sourceLanguage,
          targetLanguage,
          model,
          recaptchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Translation failed")
      }

      setTranslatedText(data.translatedText)
    } catch (error) {
      console.error("Translation error:", error)
      toast({
        title: "Translation Error",
        description: error instanceof Error ? error.message : "Failed to translate text",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const playTranslation = () => {
    if (!translatedText || isPlaying) return

    setIsPlaying(true)

    const utterance = new SpeechSynthesisUtterance(translatedText)
    utterance.lang = targetLanguage

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      toast({
        title: "Playback Error",
        description: "Failed to play translation",
        variant: "destructive",
      })
    }

    window.speechSynthesis.speak(utterance)
  }

  const handleSave = () => {
    if (extractedText && translatedText) {
      addToHistory({
        sourceLanguage,
        targetLanguage,
        sourceText: extractedText,
        translatedText,
        timestamp: new Date().toISOString(),
        mode: "audio",
      })

      toast({
        title: "Saved",
        description: "Audio translation saved to history",
      })
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col items-center space-y-4">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />

        <Button
          onClick={handleUploadClick}
          variant="outline"
          className="w-full max-w-xs flex items-center justify-center"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Audio File
        </Button>

        {file && (
          <div className="flex items-center space-x-2 text-sm">
            <FileAudio className="h-4 w-4" />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
          </div>
        )}

        {file && !isProcessing && !extractedText && (
          <Button onClick={processAudioFile} className="w-full max-w-xs">
            Process Audio
          </Button>
        )}

        {isProcessing && (
          <div className="w-full max-w-md space-y-2">
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">Processing audio... {processingProgress}%</p>
          </div>
        )}
      </div>

      {extractedText && (
        <div>
          <div className="mb-2 text-sm font-medium">Extracted Text:</div>
          <Textarea value={extractedText} readOnly className="min-h-[80px]" />

          <div className="flex justify-center mt-4">
            <Button
              onClick={handleTranslate}
              disabled={!extractedText.trim() || isTranslating}
              className="w-full sm:w-auto"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                "Translate"
              )}
            </Button>
          </div>
        </div>
      )}

      {translatedText && (
        <div className="space-y-2">
          <div className="mb-2 text-sm font-medium">Translated Text:</div>
          <Textarea value={translatedText} readOnly className="min-h-[80px]" />

          <div className="flex justify-center space-x-2">
            <Button onClick={playTranslation} disabled={isPlaying} variant="outline">
              {isPlaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Play
                </>
              )}
            </Button>

            <Button onClick={handleSave} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
