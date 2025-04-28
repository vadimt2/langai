'use client';

import { useConsent } from './consent-context';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Cookie } from 'lucide-react';

export function ConsentBanner() {
  const { showBanner, acceptAll, acceptNecessaryOnly, openPreferences } =
    useConsent();

  if (!showBanner) return null;

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 animate-in fade-in-0 slide-in-from-bottom-5 duration-500'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-4 rounded-t-lg border bg-background p-4 shadow-lg md:p-6'>
          <div className='md:flex md:items-start md:justify-between'>
            <div className='mb-6 flex space-x-3 md:mb-0 md:max-w-3xl'>
              <div className='hidden sm:block'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                  <Cookie className='h-5 w-5 text-primary' />
                </div>
              </div>
              <div>
                <h2 className='mb-2 text-lg font-semibold'>
                  Privacy Preferences
                </h2>
                <p className='mb-1 text-sm text-muted-foreground'>
                  We use cookies to enhance your browsing experience, analyze
                  site traffic, and provide personalized content. By clicking
                  "Accept All", you consent to our use of all cookies.
                </p>
                <p className='text-sm text-muted-foreground'>
                  You can customize your preferences by clicking "Customize
                  Settings" or choose "Essential Only" for necessary cookies.
                </p>
              </div>
            </div>
            <div className='flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0'>
              <Button
                variant='outline'
                onClick={openPreferences}
                className='justify-center'
                size='sm'
              >
                <Shield className='mr-2 h-4 w-4' />
                Customize Settings
              </Button>
              <Button
                variant='outline'
                onClick={acceptNecessaryOnly}
                className='justify-center'
                size='sm'
              >
                <Lock className='mr-2 h-4 w-4' />
                Essential Only
              </Button>
              <Button onClick={acceptAll} className='justify-center' size='sm'>
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
