"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Play, Trash2, ChevronDown, ChevronUp, Copy } from "lucide-react"
import { useHistory } from "@/context/history-context"
import { formatDistanceToNow } from "date-fns"
import { CircleFlag } from "react-circle-flags"
import { getLanguageByCode } from "@/data/languages"
import { useToast } from "@/hooks/use-toast"

// Character limit for text preview
const TEXT_PREVIEW_LIMIT = 150

export default function TranslationHistory() {
  const { history, clearHistory } = useHistory()
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const textHistory = history.filter((item) => item.mode === "text")
  const voiceHistory = history.filter((item) => item.mode === "voice")

  const playTranslation = (text: string, language: string, id: string) => {
    if (isPlaying) return

    setIsPlaying(id)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language

    utterance.onend = () => {
      setIsPlaying(null)
    }

    utterance.onerror = () => {
      setIsPlaying(null)
    }

    window.speechSynthesis.speak(utterance)
  }

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard",
    })
  }

  // Function to render text with proper truncation
  const renderText = (text: string, id: string, field: string) => {
    const isExpanded = expandedItems[`${id}-${field}`]
    const needsTruncation = text.length > TEXT_PREVIEW_LIMIT

    if (!needsTruncation) {
      return <p className="whitespace-pre-wrap break-words">{text}</p>
    }

    return (
      <div>
        <p className="whitespace-pre-wrap break-words">
          {isExpanded ? text : `${text.substring(0, TEXT_PREVIEW_LIMIT)}...`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => toggleExpand(`${id}-${field}`)} className="mt-2 h-8 text-xs">
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" /> Show more
            </>
          )}
        </Button>
      </div>
    )
  }

  if (history.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Translation History</CardTitle>
        <Button variant="outline" size="sm" onClick={clearHistory}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text ({textHistory.length})</TabsTrigger>
            <TabsTrigger value="voice">Voice ({voiceHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            {textHistory.length > 0 ? (
              <div className="space-y-6 mt-4">
                {textHistory.map((item) => {
                  const sourceLanguage = getLanguageByCode(item.sourceLanguage)
                  const targetLanguage = getLanguageByCode(item.targetLanguage)

                  return (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      {/* Header with flags and metadata */}
                      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex flex-col items-center">
                            {sourceLanguage && (
                              <CircleFlag
                                countryCode={sourceLanguage.countryCode.toLowerCase()}
                                height={100}
                                width={100}
                              />
                            )}
                            <span className="mt-2 text-sm">{sourceLanguage?.name || item.sourceLanguage}</span>
                          </div>

                          <div className="flex justify-center">
                            <div className="text-2xl">→</div>
                          </div>

                          <div className="flex flex-col items-center">
                            {targetLanguage && (
                              <CircleFlag
                                countryCode={targetLanguage.countryCode.toLowerCase()}
                                height={100}
                                width={100}
                              />
                            )}
                            <span className="mt-2 text-sm">{targetLanguage?.name || item.targetLanguage}</span>
                          </div>

                          <div className="ml-auto text-sm text-gray-500">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Original:</h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(item.sourceText)}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy original text</span>
                              </Button>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md max-h-[300px] overflow-auto">
                              {renderText(item.sourceText, item.id, "source")}
                            </div>
                          </div>

                          <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Translation:</h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(item.translatedText)}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy translated text</span>
                              </Button>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md max-h-[300px] overflow-auto">
                              {renderText(item.translatedText, item.id, "translated")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">No text translations saved</p>
            )}
          </TabsContent>

          <TabsContent value="voice">
            {voiceHistory.length > 0 ? (
              <div className="space-y-6 mt-4">
                {voiceHistory.map((item) => {
                  const sourceLanguage = getLanguageByCode(item.sourceLanguage)
                  const targetLanguage = getLanguageByCode(item.targetLanguage)

                  return (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      {/* Header with flags and metadata */}
                      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex flex-col items-center">
                            {sourceLanguage && (
                              <CircleFlag
                                countryCode={sourceLanguage.countryCode.toLowerCase()}
                                height={100}
                                width={100}
                              />
                            )}
                            <span className="mt-2 text-sm">{sourceLanguage?.name || item.sourceLanguage}</span>
                          </div>

                          <div className="flex justify-center">
                            <div className="text-2xl">→</div>
                          </div>

                          <div className="flex flex-col items-center">
                            {targetLanguage && (
                              <CircleFlag
                                countryCode={targetLanguage.countryCode.toLowerCase()}
                                height={100}
                                width={100}
                              />
                            )}
                            <span className="mt-2 text-sm">{targetLanguage?.name || item.targetLanguage}</span>
                          </div>

                          <div className="ml-auto text-sm text-gray-500">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Original:</h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(item.sourceText)}
                              >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy original text</span>
                              </Button>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md max-h-[300px] overflow-auto">
                              {renderText(item.sourceText, item.id, "source")}
                            </div>
                          </div>

                          <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm font-medium">Translation:</h4>
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 mr-1"
                                  onClick={() => copyToClipboard(item.translatedText)}
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="sr-only">Copy translated text</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => playTranslation(item.translatedText, item.targetLanguage, item.id)}
                                  disabled={isPlaying !== null}
                                >
                                  <Play className="h-4 w-4" />
                                  <span className="sr-only">Play</span>
                                </Button>
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md max-h-[300px] overflow-auto">
                              {renderText(item.translatedText, item.id, "translated")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">No voice translations saved</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
