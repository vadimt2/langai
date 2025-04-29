'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ImageIcon,
  Copy,
  Save,
  Trash,
  Camera,
  Image as ImageIcon2,
  CameraOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { useHistory } from '@/context/history-context';
import { useRecaptchaContext } from '@/context/recaptcha-context';

interface ImageTranslationProps {
  sourceLanguage: string;
  targetLanguage: string;
  model?: string;
  deviceType?: string;
}

export default function ImageTranslation({
  sourceLanguage,
  targetLanguage,
  model = 'gpt-3.5-turbo',
  deviceType = 'desktop',
}: ImageTranslationProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [detectedDevice, setDetectedDevice] = useState<string>(deviceType);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rearCameraInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addToHistory } = useHistory();
  const {
    getToken,
    isLoaded: recaptchaLoaded,
    isDisabled,
  } = useRecaptchaContext();

  // Client-side device detection on component mount
  useEffect(() => {
    const detectDeviceType = () => {
      const userAgent = navigator.userAgent || '';
      // Check for common mobile/tablet patterns in user agent string
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

      if (mobileRegex.test(userAgent)) {
        // Determine if it's a tablet or phone
        if (/iPad|tablet|Tablet/i.test(userAgent)) {
          setDetectedDevice('tablet');
        } else {
          setDetectedDevice('mobile');
        }
      } else {
        setDetectedDevice('desktop');
      }
    };

    detectDeviceType();
  }, []);

  // Check if user is on a mobile device
  const isMobile = detectedDevice === 'mobile' || detectedDevice === 'tablet';

  // Set up drag and drop event handlers
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (isExtracting || isTranslating) return;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragenter', handleDragEnter);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, [isExtracting, isTranslating]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size should be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setImage(file);
    setExtractedText('');
    setTranslatedText('');

    // Create image preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleOpenRearCamera = () => {
    if (rearCameraInputRef.current) {
      rearCameraInputRef.current.click();
    }
  };

  const handleExtractText = async () => {
    if (!image) return;

    setIsExtracting(true);
    setProgress(0);
    setExtractedText('');
    setTranslatedText('');

    try {
      // Get reCAPTCHA token
      let recaptchaToken = null;
      if (recaptchaLoaded) {
        recaptchaToken = await getToken('extract_text');
      }

      // Create form data
      const formData = new FormData();
      formData.append('image', image);
      if (recaptchaToken) {
        formData.append('recaptchaToken', recaptchaToken);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      // Call the API
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Get the response text first
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      if (!response.ok) {
        // Special handling for reCAPTCHA failures
        if (data.recaptchaFailed) {
          throw new Error(
            'Security verification failed. Please try again later.'
          );
        }
        throw new Error(data.error || 'Text extraction failed');
      }

      if (!data.extractedText) {
        throw new Error('No text extracted from image');
      }

      setExtractedText(data.extractedText);
      toast({
        title: 'Text extracted',
        description: 'Successfully extracted text from image',
      });
    } catch (error) {
      console.error('Text extraction error:', error);
      toast({
        title: 'Extraction Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to extract text from image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTranslate = async () => {
    if (!extractedText.trim()) return;

    setIsTranslating(true);
    setTranslatedText('');

    try {
      // Get reCAPTCHA token
      let recaptchaToken = null;
      if (recaptchaLoaded) {
        recaptchaToken = await getToken('translate');
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: extractedText,
          sourceLanguage,
          targetLanguage,
          model,
          recaptchaToken,
        }),
      });

      // Get the response text first
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`
        );
      }

      if (!response.ok) {
        // Special handling for reCAPTCHA failures
        if (data.recaptchaFailed) {
          throw new Error(
            'Security verification failed. Please try again later.'
          );
        }
        throw new Error(data.error || 'Translation failed');
      }

      if (!data.translatedText) {
        throw new Error('No translation returned');
      }

      setTranslatedText(data.translatedText);
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to translate text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    toast({
      title: 'Copied',
      description: 'Translation copied to clipboard',
    });
  };

  const handleSave = () => {
    if (extractedText && translatedText) {
      addToHistory({
        sourceLanguage,
        targetLanguage,
        sourceText: `[Image] ${extractedText.substring(0, 100)}${
          extractedText.length > 100 ? '...' : ''
        }`,
        translatedText,
        timestamp: new Date().toISOString(),
        mode: 'text',
      });

      toast({
        title: 'Saved',
        description: 'Translation saved to history',
      });
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setExtractedText('');
    setTranslatedText('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (rearCameraInputRef.current) {
      rearCameraInputRef.current.value = '';
    }
  };

  const handleDropZoneClick = () => {
    if (!isExtracting && !isTranslating && !isMobile) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className='space-y-4 mt-4'>
      <Card>
        <CardContent className='pt-6'>
          {!imagePreview ? (
            <>
              <input
                type='file'
                accept='image/*'
                onChange={handleImageChange}
                className='hidden'
                id='image-upload'
                ref={fileInputRef}
                disabled={isExtracting || isTranslating}
              />
              <input
                type='file'
                accept='image/*'
                capture='environment'
                onChange={handleImageChange}
                className='hidden'
                id='rear-camera-upload'
                ref={rearCameraInputRef}
                disabled={isExtracting || isTranslating}
              />
              {isMobile ? (
                <div className='flex flex-col space-y-4'>
                  <h3 className='text-lg font-medium text-center'>
                    Upload an Image
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <Button
                      onClick={handleOpenGallery}
                      variant='outline'
                      disabled={isExtracting || isTranslating}
                      className='flex flex-col items-center justify-center h-32 py-6 px-2'
                    >
                      <ImageIcon2 className='h-8 w-8 mb-2' />
                      <span className='text-sm'>Gallery</span>
                    </Button>
                    <Button
                      onClick={handleOpenRearCamera}
                      variant='outline'
                      disabled={isExtracting || isTranslating}
                      className='flex flex-col items-center justify-center h-32 py-6 px-2'
                    >
                      <Camera className='h-8 w-8 mb-2' />
                      <span className='text-sm'>Camera</span>
                    </Button>
                  </div>
                  <p className='text-xs text-gray-500 text-center'>
                    You may need to grant permission to access your camera or
                    photo library
                  </p>
                </div>
              ) : (
                <div
                  ref={dropZoneRef}
                  onClick={handleDropZoneClick}
                  className={`flex flex-col items-center justify-center border-2 ${
                    isDragging
                      ? 'border-primary border-dashed bg-primary/5'
                      : 'border-dashed border-gray-300'
                  } rounded-lg p-12 transition-colors duration-200 ease-in-out cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900`}
                  role='button'
                  tabIndex={0}
                  aria-label='Upload image'
                >
                  <ImageIcon className='h-8 w-8 text-gray-400 mb-4' />
                  <p className='text-sm text-gray-500 mb-2'>
                    {isDragging
                      ? 'Drop your image here'
                      : 'Drag & drop or click to upload an image'}
                  </p>
                  <p className='text-xs text-gray-400'>
                    Supported formats: JPEG, PNG, GIF, etc. (Max 5MB)
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <h3 className='text-lg font-medium'>Image Preview</h3>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleReset}
                  title='Remove image'
                >
                  <Trash className='h-4 w-4 mr-2' />
                  Remove
                </Button>
              </div>

              <div className='relative border rounded-lg overflow-hidden'>
                <img
                  src={imagePreview || '/placeholder.svg'}
                  alt='Uploaded image'
                  className='max-h-[300px] w-full object-contain'
                />
              </div>

              {!extractedText ? (
                <Button
                  onClick={handleExtractText}
                  disabled={isExtracting}
                  className='w-full'
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Extracting text... {progress}%
                    </>
                  ) : (
                    'Extract Text from Image'
                  )}
                </Button>
              ) : (
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-medium mb-2'>
                      Extracted Text:
                    </h3>
                    <Textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className='min-h-[100px]'
                    />
                  </div>

                  {!translatedText ? (
                    <Button
                      onClick={handleTranslate}
                      disabled={!extractedText.trim() || isTranslating}
                      className='w-full'
                    >
                      {isTranslating ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Translating...
                        </>
                      ) : (
                        'Translate Text'
                      )}
                    </Button>
                  ) : (
                    <div className='space-y-2'>
                      <h3 className='text-sm font-medium mb-2'>
                        Translated Text:
                      </h3>
                      <div className='relative'>
                        <Textarea
                          value={translatedText}
                          readOnly
                          className='min-h-[100px]'
                        />
                        <div className='absolute top-2 right-2 flex space-x-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleCopy}
                            title='Copy to clipboard'
                          >
                            <Copy className='h-4 w-4' />
                            <span className='sr-only'>Copy to clipboard</span>
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleSave}
                            title='Save to history'
                          >
                            <Save className='h-4 w-4' />
                            <span className='sr-only'>Save to history</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isExtracting && (
                <div className='mt-4'>
                  <Progress value={progress} className='h-2' />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
