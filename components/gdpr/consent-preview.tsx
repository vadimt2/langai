'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useConsent, ConsentProvider } from './consent-context';
import { ConsentBanner } from './consent-banner';
import { ConsentSettings } from './consent-settings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, Cookie, Shield } from 'lucide-react';

/**
 * Internal component that needs ConsentProvider wrapping
 */
function ConsentDisplay() {
  const {
    consentState,
    openPreferences,
    closeBanner,
    openBanner,
    showBanner,
    acceptAll,
    acceptNecessaryOnly,
  } = useConsent();

  // Force show the banner for preview purposes
  useEffect(() => {
    if (!showBanner) {
      // Small delay to ensure context is properly initialized
      const timer = setTimeout(() => {
        openBanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showBanner, openBanner]);

  return (
    <div className='space-y-8'>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Cookie className='h-5 w-5' />
              Cookie Banner
            </CardTitle>
            <CardDescription>
              Shows when a user first visits the site or when consent expires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openBanner} className='mb-2 w-full'>
              Show Banner
            </Button>
            <div className='rounded-lg border p-4'>
              <h3 className='mb-2 text-sm font-medium'>
                Current Consent State:
              </h3>
              <div className='space-y-1 text-xs'>
                <div className='flex justify-between'>
                  <span>Necessary:</span>
                  <span className='font-medium text-green-600'>
                    {consentState.necessary ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Analytics:</span>
                  <span
                    className={
                      consentState.analytics
                        ? 'font-medium text-green-600'
                        : 'font-medium text-red-600'
                    }
                  >
                    {consentState.analytics ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Marketing:</span>
                  <span
                    className={
                      consentState.marketing
                        ? 'font-medium text-green-600'
                        : 'font-medium text-red-600'
                    }
                  >
                    {consentState.marketing ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Preferences:</span>
                  <span
                    className={
                      consentState.preferences
                        ? 'font-medium text-green-600'
                        : 'font-medium text-red-600'
                    }
                  >
                    {consentState.preferences ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Has Interacted:</span>
                  <span
                    className={
                      consentState.hasInteracted
                        ? 'font-medium text-green-600'
                        : 'font-medium text-red-600'
                    }
                  >
                    {consentState.hasInteracted ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button
              variant='outline'
              size='sm'
              className='gap-1'
              onClick={acceptNecessaryOnly}
            >
              <Shield className='h-3.5 w-3.5' />
              Reset to Necessary Only
            </Button>
            <Button size='sm' className='gap-1' onClick={acceptAll}>
              <Cookie className='h-3.5 w-3.5' />
              Accept All
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Consent Settings
            </CardTitle>
            <CardDescription>
              Detailed preferences panel for managing cookie consent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => openPreferences(true)} className='w-full'>
              Open Settings Dialog
            </Button>
          </CardContent>
          <CardFooter className='flex flex-col items-start'>
            <p className='mb-2 text-sm text-muted-foreground'>
              The settings dialog allows users to customize their cookie
              preferences with detailed explanations for each category.
            </p>
            <p className='text-sm text-muted-foreground'>
              It includes tabs for general settings, information about cookies,
              and a detailed list of cookies used on the site.
            </p>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>
            How to integrate these GDPR components into your Next.js application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='setup'>
            <TabsList className='mb-4 grid w-full grid-cols-3'>
              <TabsTrigger value='setup'>Setup</TabsTrigger>
              <TabsTrigger value='usage'>Usage</TabsTrigger>
              <TabsTrigger value='customization'>Customization</TabsTrigger>
            </TabsList>

            <TabsContent value='setup' className='space-y-4'>
              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>
                  1. Wrap your application with ConsentProvider
                </h3>
                <pre className='overflow-x-auto whitespace-pre-wrap text-xs'>
                  {`// in your layout.tsx
import { ConsentProvider } from '@/components/gdpr/consent-context';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ConsentProvider>
          {children}
          <ConsentBanner />
        </ConsentProvider>
      </body>
    </html>
  );
}`}
                </pre>
              </div>

              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>
                  2. Add the ConsentBanner to your layout
                </h3>
                <p className='mb-2 text-sm'>
                  The banner will automatically show to new visitors or when
                  consent expires.
                </p>
              </div>

              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>
                  3. Add a settings button in your footer
                </h3>
                <pre className='overflow-x-auto whitespace-pre-wrap text-xs'>
                  {`// in your footer component
import { useConsent } from '@/components/gdpr/consent-context';
import { Button } from '@/components/ui/button';

export function Footer() {
  const { openPreferences } = useConsent();
  
  return (
    <footer>
      {/* Footer content */}
      <Button variant="link" onClick={() => openPreferences(true)}>
        Cookie Settings
      </Button>
    </footer>
  );
}`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value='usage' className='space-y-4'>
              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>
                  Using the consent state in your components
                </h3>
                <pre className='overflow-x-auto whitespace-pre-wrap text-xs'>
                  {`// Example: Conditional loading of analytics
import { useConsent } from '@/components/gdpr/consent-context';

export function AnalyticsWrapper({ children }) {
  const { consentState } = useConsent();
  
  // Only render analytics if user has consented
  if (!consentState.analytics) {
    return children;
  }
  
  return (
    <>
      {/* Analytics scripts */}
      <script>
        {/* Google Analytics or similar */}
      </script>
      {children}
    </>
  );
}`}
                </pre>
              </div>

              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>
                  Adding the Settings component
                </h3>
                <pre className='overflow-x-auto whitespace-pre-wrap text-xs'>
                  {`// in your layout.tsx
import { ConsentSettings } from '@/components/gdpr/consent-settings';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ConsentBanner />
      <ConsentSettings />
    </>
  );
}`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value='customization' className='space-y-4'>
              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>
                  Customizing the cookie categories
                </h3>
                <p className='text-sm mb-2'>
                  The consent system supports four categories: necessary,
                  analytics, marketing, and preferences.
                </p>
                <p className='text-sm'>
                  You can modify the descriptions and cookie lists in the
                  components to match your site's actual cookie usage.
                </p>
              </div>

              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>Styling customization</h3>
                <p className='text-sm'>
                  Both components use Tailwind CSS and can be easily customized
                  by modifying the class names. The components also respect the
                  light/dark theme when using next-themes.
                </p>
              </div>

              <div className='rounded-lg bg-muted p-4'>
                <h3 className='mb-2 font-medium'>Consent expiration</h3>
                <p className='text-sm'>
                  By default, consent expires after 180 days. You can change
                  this by modifying the EXPIRY_DAYS constant in
                  consent-context.tsx.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* The actual components (banner will only show if showBanner is true) */}
      <ConsentBanner />
      <ConsentSettings />
    </div>
  );
}

export function ConsentPreview() {
  // This ensures the preview works even when used elsewhere in the app
  // by providing its own ConsentProvider
  return (
    <div className='container py-10'>
      <ConsentProvider>
        <ConsentDisplay />
      </ConsentProvider>
    </div>
  );
}
