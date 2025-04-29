import { Suspense } from 'react';
import ImageTranslation from '@/components/image-translation';
import { getLanguagePreferences } from '@/app/actions/language-preferences';
import { getDefaultDeviceType } from '@/app/actions/device-detection';

// Import using a relative import to avoid TypeScript path resolution issues
import { LanguageControlsClient } from '../../components/language-controls-client';

// Add dynamic export to prevent static rendering issues with cookies
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function ImagePage() {
  // Get language preferences
  const { sourceLanguage, targetLanguage } = await getLanguagePreferences();

  // Get a safe default device type that doesn't cause TypeScript errors
  // We'll detect the actual device type on the client side
  const deviceType = await getDefaultDeviceType();

  return (
    <div className='container py-6 max-w-5xl'>
      <h1 className='text-2xl font-bold mb-6'>Image Translation</h1>
      <p className='text-gray-500 mb-6'>
        Upload an image containing text and translate it to your desired
        language.
      </p>

      <div className='space-y-6'>
        <LanguageControlsClient
          initialSourceLanguage={sourceLanguage}
          initialTargetLanguage={targetLanguage}
        />
        <Suspense
          fallback={
            <div className='flex items-center justify-center p-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          }
        >
          <ImageTranslation
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            deviceType={deviceType}
          />
        </Suspense>
      </div>
    </div>
  );
}
