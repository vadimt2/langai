'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ParsedTranslation {
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
}

export default function SharePage() {
  const searchParams = useSearchParams();
  const [parsedTranslation, setParsedTranslation] =
    useState<ParsedTranslation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get the shared text from the URL
    const text = searchParams.get('text');
    if (text) {
      try {
        const decodedText = decodeURIComponent(text);

        // Parse the text to extract original and translation
        const result = parseSharedText(decodedText);
        setParsedTranslation(result);
      } catch (error) {
        console.error('Failed to decode or parse shared text:', error);
        setParsedTranslation(null);
      }
    }
    setIsLoading(false);
  }, [searchParams]);

  // Parse the shared text into original and translated parts
  const parseSharedText = (text: string): ParsedTranslation => {
    // Example format: "Original (English):\nHello\n\nTranslation (Spanish):\nHola"
    const originalMatch = text.match(
      /Original \(([^)]+)\):\s*\n([\s\S]*?)\n\nTranslation \(([^)]+)\):\s*\n([\s\S]*)/
    );

    if (originalMatch && originalMatch.length === 5) {
      return {
        sourceLanguage: originalMatch[1],
        sourceText: originalMatch[2],
        targetLanguage: originalMatch[3],
        translatedText: originalMatch[4],
      };
    }

    // Fallback if parsing fails
    return {
      sourceLanguage: 'Unknown',
      targetLanguage: 'Unknown',
      sourceText: '',
      translatedText: text,
    };
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
    });
  };

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Link href='/'>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 rounded-full'
              >
                <ArrowLeft className='h-4 w-4' />
                <span className='sr-only'>Back to home</span>
              </Button>
            </Link>
            <CardTitle>Shared Translation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='py-8 text-center'>
              <p className='text-gray-500'>Loading shared translation...</p>
            </div>
          ) : parsedTranslation ? (
            <div className='space-y-6'>
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <h3 className='text-sm font-medium'>
                    Original ({parsedTranslation.sourceLanguage})
                  </h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleCopy(parsedTranslation.sourceText)}
                    className='h-8'
                  >
                    <Copy className='h-4 w-4 mr-1' />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={parsedTranslation.sourceText}
                  readOnly
                  className='min-h-[120px]'
                />
              </div>

              <div>
                <div className='flex justify-between items-center mb-2'>
                  <h3 className='text-sm font-medium'>
                    Translation ({parsedTranslation.targetLanguage})
                  </h3>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleCopy(parsedTranslation.translatedText)}
                    className='h-8'
                  >
                    <Copy className='h-4 w-4 mr-1' />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={parsedTranslation.translatedText}
                  readOnly
                  className='min-h-[120px]'
                />
              </div>

              <div className='mt-6'>
                <Link href='/'>
                  <Button variant='outline' className='w-full'>
                    Create your own translation
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className='py-8 text-center'>
              <p className='text-gray-500'>
                No translation was provided in the shared link or the format
                could not be recognized.
              </p>
              <div className='mt-6'>
                <Link href='/'>
                  <Button variant='outline' className='w-full'>
                    Create a translation
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
