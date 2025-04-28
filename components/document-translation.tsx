"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Download, FileText, Save, FileIcon, FileSpreadsheet, File, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { useHistory } from "@/context/history-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRecaptchaContext } from "@/context/recaptcha-context"

// We'll dynamically import the PDF.js library
declare global {
  interface Window {
    pdfjsLib: any
  }
}

interface DocumentTranslationProps {
  sourceLanguage: string
  targetLanguage: string
  model?: string
}

// Supported file types
const SUPPORTED_FILE_TYPES = {
  "text/plain": {
    extension: ".txt",
    icon: FileText,
    name: "Text",
  },
  "application/pdf": {
    extension: ".pdf",
    icon: FileIcon,
    name: "PDF",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: ".docx",
    icon: File,
    name: "Word",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    extension: ".xlsx",
    icon: FileSpreadsheet,
    name: "Excel",
  },
}

// Maximum number of concurrent translation requests
const MAX_CONCURRENT_REQUESTS = 5

export default function DocumentTranslation({
  sourceLanguage,
  targetLanguage,
  model = "gpt-3.5-turbo",
}: DocumentTranslationProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [isTranslating, setIsTranslating] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [translatedText, setTranslatedText] = useState<string>("")
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isPdfJsLoaded, setIsPdfJsLoaded] = useState<boolean>(false)
  const [isPdfJsLoading, setIsPdfJsLoading] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { addToHistory } = useHistory()
  const abortControllerRef = useRef<AbortController | null>(null)
  const { getToken, isLoaded: recaptchaLoaded, isDisabled } = useRecaptchaContext()

  // Load PDF.js library
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== "undefined" && !window.pdfjsLib && !isPdfJsLoading) {
        try {
          setIsPdfJsLoading(true)

          // Load PDF.js from CDN
          const script = document.createElement("script")
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          script.async = true

          // Create a promise to track when the script is loaded
          const scriptLoadPromise = new Promise<void>((resolve, reject) => {
            script.onload = () => {
              // Initialize PDF.js worker
              const workerScript = document.createElement("script")
              workerScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
              workerScript.async = true

              workerScript.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
                setIsPdfJsLoaded(true)
                setIsPdfJsLoading(false)
                console.log("PDF.js loaded successfully")
                resolve()
              }

              workerScript.onerror = () => {
                setIsPdfJsLoading(false)
                reject(new Error("Failed to load PDF.js worker"))
              }

              document.body.appendChild(workerScript)
            }

            script.onerror = () => {
              setIsPdfJsLoading(false)
              reject(new Error("Failed to load PDF.js"))
            }
          })

          document.body.appendChild(script)

          // Wait for the script to load
          await scriptLoadPromise

          // Process any pending PDF file
          if (pendingPdfFile) {
            handlePdfFile(pendingPdfFile)
            setPendingPdfFile(null)
          }
        } catch (error) {
          console.error("Failed to load PDF.js:", error)
          setIsPdfJsLoading(false)
          toast({
            title: "PDF.js Loading Error",
            description: "Failed to load PDF processing library. Please try again later.",
            variant: "destructive",
          })
        }
      } else if (window.pdfjsLib) {
        setIsPdfJsLoaded(true)

        // Process any pending PDF file
        if (pendingPdfFile) {
          handlePdfFile(pendingPdfFile)
          setPendingPdfFile(null)
        }
      }
    }

    loadPdfJs()
  }, [pendingPdfFile, isPdfJsLoading, toast])

  // Set up drag and drop event handlers
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (isExtracting || isTranslating) return

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    }

    dropZone.addEventListener("dragover", handleDragOver)
    dropZone.addEventListener("dragenter", handleDragEnter)
    dropZone.addEventListener("dragleave", handleDragLeave)
    dropZone.addEventListener("drop", handleDrop)

    return () => {
      dropZone.removeEventListener("dragover", handleDragOver)
      dropZone.removeEventListener("dragenter", handleDragEnter)
      dropZone.removeEventListener("dragleave", handleDragLeave)
      dropZone.removeEventListener("drop", handleDrop)
    }
  }, [isExtracting, isTranslating])

  // Cleanup function for abort controller
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleFile = async (selectedFile: File) => {
    // Reset any previous errors
    setExtractionError(null)

    // Check file type
    const fileType = selectedFile.type
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(fileType)) {
      toast({
        title: "Unsupported File Type",
        description: `Currently only ${Object.values(SUPPORTED_FILE_TYPES)
          .map((t) => t.name)
          .join(", ")} files are supported.`,
        variant: "destructive",
      })
      return
    }

    // Check file size (limit to 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size should be less than 10MB.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setFileContent("")
    setTranslatedText("")

    // For PDF files, check if PDF.js is loaded
    if (fileType === "application/pdf") {
      if (!isPdfJsLoaded) {
        if (!isPdfJsLoading) {
          // Start loading PDF.js and queue this file for processing
          setPendingPdfFile(selectedFile)
          toast({
            title: "Loading PDF Library",
            description: "Please wait while we load the PDF processing library...",
          })
        } else {
          // PDF.js is already loading, just queue this file
          setPendingPdfFile(selectedFile)
          toast({
            title: "PDF Library Loading",
            description: "PDF processing library is loading. Your file will be processed automatically when ready.",
          })
        }
        return
      }

      // PDF.js is loaded, process the file
      handlePdfFile(selectedFile)
    } else {
      // For non-PDF files, extract content normally
      extractFileContent(selectedFile)
    }
  }

  const handlePdfFile = async (pdfFile: File) => {
    setIsExtracting(true)
    setProgress(10)

    try {
      toast({
        title: "Processing PDF",
        description: "Extracting text from PDF. This may take a moment...",
      })

      // Read the file as ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer()

      try {
        // Load the PDF document
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer })
        setProgress(20)

        const pdf = await loadingTask.promise
        setProgress(30)

        let extractedText = ""

        // Get total pages
        const numPages = pdf.numPages

        // Extract text from each page - process pages in parallel for speed
        const pagePromises = []
        for (let i = 1; i <= numPages; i++) {
          pagePromises.push(
            (async () => {
              const page = await pdf.getPage(i)
              const textContent = await page.getTextContent()
              return textContent.items.map((item: any) => item.str).join(" ")
            })(),
          )
        }

        // Process pages in batches of 5 for better performance
        const batchSize = 5
        let completedPages = 0

        for (let i = 0; i < pagePromises.length; i += batchSize) {
          const batch = pagePromises.slice(i, i + batchSize)
          const pageTexts = await Promise.all(batch)

          // Add the extracted text from this batch
          extractedText += pageTexts.join("\n\n")

          // Update progress
          completedPages += batch.length
          setProgress(30 + Math.floor((completedPages / numPages) * 60))
        }

        if (!extractedText.trim()) {
          throw new Error("No text could be extracted from the PDF. The PDF might be scanned or contain only images.")
        }

        setFileContent(extractedText)
        setProgress(100)

        toast({
          title: "PDF Text Extracted",
          description: `Successfully extracted text from ${numPages} page${numPages !== 1 ? "s" : ""}. Translating now...`,
        })

        // Automatically start translation
        setTimeout(() => {
          handleTranslate(extractedText)
        }, 500)
      } catch (pdfError) {
        console.error("PDF.js extraction error:", pdfError)
        throw new Error(
          `Failed to extract text from PDF: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`,
        )
      }
    } catch (error) {
      console.error("PDF processing error:", error)
      setExtractionError(error instanceof Error ? error.message : "Failed to process PDF")
      toast({
        title: "PDF Processing Error",
        description: error instanceof Error ? error.message : "Failed to process PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const extractFileContent = async (file: File) => {
    setIsExtracting(true)
    setProgress(10)
    setExtractionError(null)

    try {
      // For PDF files, use client-side PDF.js - this is now handled by handlePdfFile
      if (file.type === "application/pdf") {
        handlePdfFile(file)
        return
      }

      // For text files, read directly
      if (file.type === "text/plain") {
        try {
          const text = await file.text()
          setFileContent(text)
          setProgress(100)

          toast({
            title: "Text Extracted",
            description: "Successfully extracted text from file. Translating now...",
          })

          // Automatically start translation
          setTimeout(() => {
            handleTranslate(text)
          }, 500)

          return
        } catch (textError) {
          console.error("Text file reading error:", textError)
          throw new Error(
            `Failed to read text file: ${textError instanceof Error ? textError.message : String(textError)}`,
          )
        }
      }

      // Get reCAPTCHA token
      let recaptchaToken = null
      if (recaptchaLoaded) {
        recaptchaToken = await getToken("extract_document")
      }

      // For other document types, use the API
      const formData = new FormData()
      formData.append("file", file)
      if (recaptchaToken) {
        formData.append("recaptchaToken", recaptchaToken)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 2
          return newProgress > 80 ? 80 : newProgress
        })
      }, 500)

      const response = await fetch("/api/extract-document-content", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(90)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to extract content"

        try {
          const errorData = JSON.parse(errorText)
          // Special handling for reCAPTCHA failures
          if (errorData.recaptchaFailed) {
            errorMessage = "Security verification failed. Please try again later."
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText.substring(0, 100)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.extractedText) {
        throw new Error("No text extracted from document")
      }

      setFileContent(data.extractedText)
      setProgress(100)

      toast({
        title: "Text Extracted",
        description: "Successfully extracted text from document. Translating now...",
      })

      // Automatically start translation
      setTimeout(() => {
        handleTranslate(data.extractedText)
      }, 500)
    } catch (error) {
      console.error("Text extraction error:", error)
      setExtractionError(error instanceof Error ? error.message : "Failed to extract text from document")
      toast({
        title: "Extraction Error",
        description: error instanceof Error ? error.message : "Failed to extract text from document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleTranslate = async (contentToTranslate?: string) => {
    const textToTranslate = contentToTranslate || fileContent

    if (!textToTranslate.trim()) {
      toast({
        title: "No Content",
        description: "No text to translate.",
        variant: "destructive",
      })
      return
    }

    // Cancel any ongoing translation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create a new abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsTranslating(true)
    setProgress(0)
    setTranslatedText("")

    try {
      // Get reCAPTCHA token
      let recaptchaToken = null
      if (recaptchaLoaded) {
        recaptchaToken = await getToken("translate")
      }

      // Improved chunking strategy - split by paragraphs first, then by size
      const chunks = smartSplitTextIntoChunks(textToTranslate, 4000) // Increased chunk size for fewer API calls
      const totalChunks = chunks.length

      toast({
        title: "Translation Started",
        description: `Translating document in ${totalChunks} chunks. This will be much faster now.`,
      })

      let completedChunks = 0
      const translatedChunks: string[] = new Array(totalChunks).fill("")

      // Process chunks in parallel with a concurrency limit
      const processBatch = async (startIndex: number) => {
        const batchPromises = []

        // Create a batch of promises up to the concurrency limit
        for (let i = startIndex; i < Math.min(startIndex + MAX_CONCURRENT_REQUESTS, chunks.length); i++) {
          batchPromises.push(
            (async (index) => {
              try {
                // Translate the chunk
                const response = await fetch("/api/translate", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    text: chunks[index],
                    sourceLanguage,
                    targetLanguage,
                    model,
                    recaptchaToken, // Add token to each request
                  }),
                  signal, // Add abort signal
                })

                if (signal.aborted) return null

                if (!response.ok) {
                  const errorText = await response.text()
                  let errorData
                  try {
                    errorData = JSON.parse(errorText)
                    // Special handling for reCAPTCHA failures
                    if (errorData.recaptchaFailed) {
                      throw new Error("Security verification failed. Please try again later.")
                    }
                  } catch (e) {
                    // If parsing fails, use the raw text
                  }
                  throw new Error(`Translation failed: ${errorText}`)
                }

                const data = await response.json()

                if (!data.translatedText) {
                  throw new Error("No translation returned")
                }

                // Store the translated chunk in the correct position
                translatedChunks[index] = data.translatedText

                // Update progress
                completedChunks++
                setProgress(Math.round((completedChunks / totalChunks) * 100))

                return index
              } catch (error) {
                if (signal.aborted) return null
                console.error(`Error translating chunk ${index}:`, error)
                throw error
              }
            })(i),
          )
        }

        // Wait for all promises in this batch to complete
        await Promise.all(batchPromises)

        // If there are more chunks to process, continue with the next batch
        if (startIndex + MAX_CONCURRENT_REQUESTS < chunks.length && !signal.aborted) {
          return processBatch(startIndex + MAX_CONCURRENT_REQUESTS)
        }
      }

      // Start processing the first batch
      await processBatch(0)

      if (signal.aborted) {
        throw new Error("Translation was cancelled")
      }

      // Combine all translated chunks
      setTranslatedText(translatedChunks.join("\n"))
      setProgress(100)

      toast({
        title: "Translation Complete",
        description: "Document has been translated successfully.",
      })
    } catch (error) {
      if (signal.aborted) {
        console.log("Translation was cancelled")
        return
      }

      console.error("Translation error:", error)
      toast({
        title: "Translation Error",
        description: error instanceof Error ? error.message : "Failed to translate text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
      abortControllerRef.current = null
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText)
    toast({
      title: "Copied",
      description: "Translation copied to clipboard",
    })
  }

  const handleSave = () => {
    if (fileContent && translatedText) {
      addToHistory({
        sourceLanguage,
        targetLanguage,
        sourceText: file ? `[Document: ${file.name}] ${fileContent.substring(0, 100)}...` : fileContent,
        translatedText: translatedText.substring(0, 100) + "...",
        timestamp: new Date().toISOString(),
        mode: "text",
      })

      toast({
        title: "Saved",
        description: "Translation saved to history",
      })
    }
  }

  const downloadTranslation = () => {
    if (!translatedText) return

    const blob = new Blob([translatedText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `translated_${file?.name || "document"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetFile = () => {
    // Cancel any ongoing translation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setFile(null)
    setFileContent("")
    setTranslatedText("")
    setProgress(0)
    setExtractionError(null)
    setPendingPdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const retryExtraction = async () => {
    if (!file) return

    setExtractionError(null)
    await extractFileContent(file)
  }

  const cancelTranslation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsTranslating(false)
      toast({
        title: "Translation Cancelled",
        description: "The translation process has been cancelled.",
      })
    }
  }

  const handleDropZoneClick = () => {
    if (!isExtracting && !isTranslating && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Improved chunking strategy that preserves paragraph structure when possible
  const smartSplitTextIntoChunks = (text: string, chunkSize: number): string[] => {
    // If text is small enough, return it as a single chunk
    if (text.length <= chunkSize) {
      return [text]
    }

    const chunks: string[] = []

    // First split by paragraphs
    const paragraphs = text.split(/\n\s*\n/)
    let currentChunk = ""

    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the chunk size
      if (currentChunk.length + paragraph.length > chunkSize) {
        // If the current chunk is not empty, add it to chunks
        if (currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = ""
        }

        // If the paragraph itself is larger than the chunk size, split it
        if (paragraph.length > chunkSize) {
          const sentenceChunks = splitLargeTextIntoChunks(paragraph, chunkSize)
          chunks.push(...sentenceChunks)
        } else {
          currentChunk = paragraph
        }
      } else {
        // Add paragraph to current chunk
        if (currentChunk.length > 0) {
          currentChunk += "\n\n"
        }
        currentChunk += paragraph
      }
    }

    // Add the last chunk if not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    return chunks
  }

  // Helper function to split large text into chunks
  const splitLargeTextIntoChunks = (text: string, chunkSize: number): string[] => {
    const chunks: string[] = []

    // Try to split by sentences first
    const sentences = text.split(/(?<=[.!?])\s+/)
    let currentChunk = ""

    for (const sentence of sentences) {
      // If adding this sentence would exceed the chunk size
      if (currentChunk.length + sentence.length > chunkSize) {
        // If the current chunk is not empty, add it to chunks
        if (currentChunk.length > 0) {
          chunks.push(currentChunk)
          currentChunk = ""
        }

        // If the sentence itself is larger than the chunk size, split it by words
        if (sentence.length > chunkSize) {
          let remainingSentence = sentence
          while (remainingSentence.length > 0) {
            const chunk = remainingSentence.substring(0, chunkSize)
            chunks.push(chunk)
            remainingSentence = remainingSentence.substring(chunkSize)
          }
        } else {
          currentChunk = sentence
        }
      } else {
        // Add sentence to current chunk
        if (currentChunk.length > 0 && !currentChunk.endsWith(" ")) {
          currentChunk += " "
        }
        currentChunk += sentence
      }
    }

    // Add the last chunk if not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk)
    }

    return chunks
  }

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="pt-6">
          {!file ? (
            <>
              <input
                type="file"
                accept="application/pdf,.pdf,.txt,text/plain,.docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
                id="document-upload"
                ref={fileInputRef}
                disabled={isExtracting || isTranslating}
              />
              <div
                ref={dropZoneRef}
                onClick={handleDropZoneClick}
                className={`flex flex-col items-center justify-center border-2 ${
                  isDragging ? "border-primary border-dashed bg-primary/5" : "border-dashed border-gray-300"
                } rounded-lg p-12 transition-colors duration-200 ease-in-out cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900`}
                role="button"
                tabIndex={0}
                aria-label="Upload document"
              >
                <div className="flex gap-2 mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                  <FileIcon className="h-8 w-8 text-gray-400" />
                  <File className="h-8 w-8 text-gray-400" />
                  <FileSpreadsheet className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {isDragging ? "Drop your document here" : "Drag & drop or click to upload a document"}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Supported formats: TXT, PDF (best support), Word (DOCX), Excel (XLSX)
                </p>
                {isPdfJsLoading && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading PDF processing library...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {(() => {
                    const FileTypeIcon =
                      SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]?.icon || FileText
                    return <FileTypeIcon className="h-5 w-5 text-gray-500" />
                  })()}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFile} disabled={isExtracting || isTranslating}>
                  Remove
                </Button>
              </div>

              {pendingPdfFile && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertTitle>Loading PDF Library</AlertTitle>
                  <AlertDescription>
                    Please wait while we load the PDF processing library. Your file will be processed automatically when
                    ready.
                  </AlertDescription>
                </Alert>
              )}

              {extractionError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error extracting text</AlertTitle>
                  <AlertDescription>
                    {extractionError}
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={retryExtraction}>
                        Retry extraction
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {(isExtracting || isTranslating) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <p>{isExtracting ? "Extracting text..." : "Translating..."}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{progress}%</span>
                      {isTranslating && (
                        <Button variant="outline" size="sm" onClick={cancelTranslation} className="h-8 px-2">
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {fileContent && !isExtracting && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Document Content:</h3>
                  <Textarea value={fileContent} readOnly className="min-h-[150px]" />
                </div>
              )}

              {translatedText && !isTranslating && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium">Translation:</h3>
                  </div>
                  <Textarea value={translatedText} readOnly className="min-h-[150px]" />

                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" onClick={downloadTranslation} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={handleCopy} className="flex-1">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" onClick={handleSave} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Save to History
                    </Button>
                  </div>
                </div>
              )}

              {!isExtracting && !isTranslating && fileContent && !translatedText && (
                <Button onClick={() => handleTranslate()} disabled={!fileContent.trim()} className="w-full">
                  Translate Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
