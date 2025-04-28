'use client';

import { useState, useEffect } from 'react';
import { useConsent, type ConsentState } from './consent-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, CheckCircle2, Lock, RefreshCw } from 'lucide-react';

export function ConsentSettings() {
  const {
    consentState,
    updateConsent,
    acceptAll,
    acceptNecessaryOnly,
    showPreferences,
    openPreferences,
    savePreferences,
  } = useConsent();

  const [localConsent, setLocalConsent] = useState<Partial<ConsentState>>({});

  // Update local state when modal opens or consent changes
  useEffect(() => {
    setLocalConsent({
      analytics: consentState.analytics,
      marketing: consentState.marketing,
      preferences: consentState.preferences,
    });
  }, [showPreferences, consentState]);

  const handleCategoryChange = (
    category: 'analytics' | 'marketing' | 'preferences',
    checked: boolean
  ) => {
    setLocalConsent((prev) => ({
      ...prev,
      [category]: checked,
    }));
  };

  const handleSave = () => {
    // Update each category if it's defined in localConsent
    if (localConsent.analytics !== undefined) {
      updateConsent('analytics', localConsent.analytics);
    }
    if (localConsent.marketing !== undefined) {
      updateConsent('marketing', localConsent.marketing);
    }
    if (localConsent.preferences !== undefined) {
      updateConsent('preferences', localConsent.preferences);
    }
    savePreferences();
  };

  const resetToDefaults = () => {
    acceptNecessaryOnly();
  };

  return (
    <Dialog open={showPreferences} onOpenChange={openPreferences}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Shield className='h-5 w-5' />
            Privacy Preferences
          </DialogTitle>
          <DialogDescription>
            Manage how your data is used on our website
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='preferences' className='mt-4'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='preferences'>Settings</TabsTrigger>
            <TabsTrigger value='information'>Information</TabsTrigger>
            <TabsTrigger value='cookies'>Cookies List</TabsTrigger>
          </TabsList>

          <TabsContent value='preferences' className='space-y-4 pt-4'>
            <ScrollArea className='h-[50vh] pr-4 md:h-[40vh]'>
              <div className='space-y-6'>
                <div className='rounded-lg border bg-card p-4'>
                  <div className='flex items-start space-x-3'>
                    <Checkbox
                      id='necessary'
                      checked={true}
                      disabled={true}
                      className='mt-1 h-5 w-5'
                    />
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <Label
                          htmlFor='necessary'
                          className='text-base font-medium'
                        >
                          Essential Cookies
                        </Label>
                        <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                          Required
                        </span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        These cookies are necessary for the website to function
                        properly and cannot be disabled.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <div className='flex items-start space-x-3'>
                    <Checkbox
                      id='analytics'
                      checked={localConsent.analytics}
                      onCheckedChange={(checked) =>
                        handleCategoryChange('analytics', checked === true)
                      }
                      className='mt-1 h-5 w-5'
                    />
                    <div className='space-y-1'>
                      <Label
                        htmlFor='analytics'
                        className='text-base font-medium'
                      >
                        Analytics Cookies
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Help us understand how visitors interact with our
                        website by collecting and reporting anonymous
                        information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <div className='flex items-start space-x-3'>
                    <Checkbox
                      id='marketing'
                      checked={localConsent.marketing}
                      onCheckedChange={(checked) =>
                        handleCategoryChange('marketing', checked === true)
                      }
                      className='mt-1 h-5 w-5'
                    />
                    <div className='space-y-1'>
                      <Label
                        htmlFor='marketing'
                        className='text-base font-medium'
                      >
                        Marketing Cookies
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Used to track visitors across websites to enable
                        personalized advertising based on your browsing history.
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <div className='flex items-start space-x-3'>
                    <Checkbox
                      id='preferences'
                      checked={localConsent.preferences}
                      onCheckedChange={(checked) =>
                        handleCategoryChange('preferences', checked === true)
                      }
                      className='mt-1 h-5 w-5'
                    />
                    <div className='space-y-1'>
                      <Label
                        htmlFor='preferences'
                        className='text-base font-medium'
                      >
                        Preference Cookies
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Allow the website to remember choices you make (such as
                        your preferred language) and provide enhanced,
                        personalized features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value='information' className='space-y-4 pt-4'>
            <ScrollArea className='h-[50vh] pr-4 md:h-[40vh]'>
              <div className='space-y-4'>
                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-2 font-semibold'>What are cookies?</h3>
                  <p className='text-sm text-muted-foreground'>
                    Cookies are small text files stored on your device when you
                    visit websites. They are used to remember your preferences,
                    understand how you use the website, and provide you with
                    relevant content.
                  </p>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-2 font-semibold'>How we use cookies</h3>
                  <p className='text-sm text-muted-foreground'>
                    We use cookies to improve your browsing experience, analyze
                    site traffic, personalize content, and serve targeted
                    advertisements. By accepting our use of cookies, you consent
                    to our collection and use of data.
                  </p>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-2 font-semibold'>Cookie expiration</h3>
                  <p className='text-sm text-muted-foreground'>
                    Your cookie preferences are stored for 180 days. After this
                    period, you will be asked to renew your consent preferences.
                  </p>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-2 font-semibold'>Your rights</h3>
                  <p className='text-sm text-muted-foreground'>
                    You have the right to choose which cookies you accept. You
                    can change your preferences at any time by clicking on the
                    "Cookie Settings" link in the footer.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value='cookies' className='space-y-4 pt-4'>
            <ScrollArea className='h-[50vh] pr-4 md:h-[40vh]'>
              <div className='space-y-4'>
                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-3 font-semibold'>Essential Cookies</h3>
                  <div className='space-y-2'>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>Session Cookie</p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Maintains your session while browsing
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: Session (deleted when browser closes)
                      </p>
                    </div>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>CSRF Token</p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Protects against cross-site request forgery
                        attacks
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: Session
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-3 font-semibold'>Analytics Cookies</h3>
                  <div className='space-y-2'>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>
                        Google Analytics (_ga)
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Distinguishes users
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: 2 years
                      </p>
                    </div>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>
                        Google Analytics (_ga_[ID])
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Stores and counts pageviews
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: 2 years
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-3 font-semibold'>Marketing Cookies</h3>
                  <div className='space-y-2'>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>
                        Facebook Pixel (_fbp)
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Tracks visitors across websites for ad
                        targeting
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: 3 months
                      </p>
                    </div>
                  </div>
                </div>

                <div className='rounded-lg border bg-card p-4'>
                  <h3 className='mb-3 font-semibold'>Preference Cookies</h3>
                  <div className='space-y-2'>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>Theme Preference</p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Remembers your theme preference (light/dark)
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: 1 year
                      </p>
                    </div>
                    <div className='rounded border p-3'>
                      <p className='text-sm font-medium'>Language Preference</p>
                      <p className='text-xs text-muted-foreground'>
                        Purpose: Remembers your language preference
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Duration: 1 year
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className='mt-4 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={resetToDefaults}
              className='h-9 gap-1'
            >
              <RefreshCw className='h-3.5 w-3.5' />
              Reset
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={acceptAll}
              className='h-9 gap-1'
            >
              <CheckCircle2 className='h-3.5 w-3.5' />
              Accept All
            </Button>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => openPreferences(false)}
            >
              Cancel
            </Button>
            <Button size='sm' onClick={handleSave} className='gap-1'>
              <Lock className='h-3.5 w-3.5' />
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
