'use client';

import { useConsent } from './consent-context';
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

export function PreferencesModal() {
  const {
    showPreferences,
    closePreferences,
    consent,
    updateConsent,
    acceptAll,
    savePreferences,
  } = useConsent();

  return (
    <Dialog
      open={showPreferences}
      onOpenChange={(open) => !open && closePreferences()}
    >
      <DialogContent className='sm:max-w-[600px] max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Customize your cookie preferences for this website
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='preferences' className='mt-2'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='preferences'>Preferences</TabsTrigger>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='about'>About Cookies</TabsTrigger>
          </TabsList>

          <TabsContent value='preferences' className='space-y-4 pt-4'>
            <ScrollArea className='h-[50vh] md:h-[40vh] pr-4'>
              <div className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-start space-x-3 pt-2'>
                    <Checkbox
                      id='necessary'
                      checked={consent.necessary}
                      disabled={true}
                      className='mt-1 h-5 w-5 rounded-sm'
                    />
                    <div className='space-y-1'>
                      <div className='flex items-center'>
                        <Label
                          htmlFor='necessary'
                          className='text-base font-medium'
                        >
                          Necessary Cookies
                        </Label>
                        <span className='ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400'>
                          Required
                        </span>
                      </div>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        These cookies are essential for the website to function
                        properly. They enable basic functionality like page
                        navigation and access to secure areas. The website
                        cannot function properly without these cookies.
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start space-x-3 pt-2'>
                    <Checkbox
                      id='analytics'
                      checked={consent.analytics}
                      onCheckedChange={(checked) =>
                        updateConsent('analytics', checked === true)
                      }
                      className='mt-1 h-5 w-5 rounded-sm'
                    />
                    <div className='space-y-1'>
                      <Label
                        htmlFor='analytics'
                        className='text-base font-medium'
                      >
                        Analytics Cookies
                      </Label>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        These cookies allow us to count visits and traffic
                        sources so we can measure and improve the performance of
                        our site. They help us know which pages are the most and
                        least popular and see how visitors move around the site.
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start space-x-3 pt-2'>
                    <Checkbox
                      id='marketing'
                      checked={consent.marketing}
                      onCheckedChange={(checked) =>
                        updateConsent('marketing', checked === true)
                      }
                      className='mt-1 h-5 w-5 rounded-sm'
                    />
                    <div className='space-y-1'>
                      <Label
                        htmlFor='marketing'
                        className='text-base font-medium'
                      >
                        Marketing Cookies
                      </Label>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        These cookies are used to track visitors across
                        websites. The intention is to display ads that are
                        relevant and engaging for the individual user and
                        thereby more valuable for publishers and third-party
                        advertisers.
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start space-x-3 pt-2'>
                    <Checkbox
                      id='preferences'
                      checked={consent.preferences}
                      onCheckedChange={(checked) =>
                        updateConsent('preferences', checked === true)
                      }
                      className='mt-1 h-5 w-5 rounded-sm'
                    />
                    <div className='space-y-1'>
                      <Label
                        htmlFor='preferences'
                        className='text-base font-medium'
                      >
                        Preferences Cookies
                      </Label>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        These cookies enable the website to provide enhanced
                        functionality and personalization. They may be set by us
                        or by third-party providers whose services we have added
                        to our pages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value='details' className='space-y-4 pt-4'>
            <ScrollArea className='h-[50vh] md:h-[40vh] pr-4'>
              <div className='space-y-6'>
                <div>
                  <h3 className='text-base font-medium mb-2'>Cookies We Use</h3>
                  <div className='space-y-4'>
                    <div className='rounded-md border border-slate-200 p-4 dark:border-slate-700'>
                      <h4 className='font-medium mb-1'>Session Cookie</h4>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
                        Type: Necessary
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Used to maintain your session while you browse our site.
                        Expires when you close your browser.
                      </p>
                    </div>

                    <div className='rounded-md border border-slate-200 p-4 dark:border-slate-700'>
                      <h4 className='font-medium mb-1'>Google Analytics</h4>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
                        Type: Analytics
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Used to distinguish users and collect information about
                        how visitors use our site. Expires after 2 years.
                      </p>
                    </div>

                    <div className='rounded-md border border-slate-200 p-4 dark:border-slate-700'>
                      <h4 className='font-medium mb-1'>Theme Preference</h4>
                      <p className='text-sm text-slate-600 dark:text-slate-400 mb-2'>
                        Type: Preferences
                      </p>
                      <p className='text-sm text-slate-600 dark:text-slate-400'>
                        Stores your preferred theme (light/dark mode). Expires
                        after 1 year.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value='about' className='space-y-4 pt-4'>
            <ScrollArea className='h-[50vh] md:h-[40vh] pr-4'>
              <div className='space-y-4'>
                <h3 className='text-base font-medium'>What Are Cookies?</h3>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  Cookies are small text files that are placed on your device to
                  store data that can be recalled by a web server in the domain
                  that placed the cookie. We use cookies and similar
                  technologies for storing and honoring your preferences and
                  settings, enabling you to sign in, providing interest-based
                  advertising, combating fraud, analyzing how our products
                  perform, and fulfilling other legitimate purposes.
                </p>

                <h3 className='text-base font-medium mt-4'>
                  How We Use Cookies
                </h3>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  We use cookies for several purposes, including:
                </p>
                <ul className='list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1 mt-2'>
                  <li>Remembering your preferences and settings</li>
                  <li>Sign-in and authentication</li>
                  <li>Security</li>
                  <li>Analytics and research</li>
                  <li>Personalized advertising</li>
                </ul>

                <h3 className='text-base font-medium mt-4'>Your Rights</h3>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  Under the GDPR and various country-specific data protection
                  laws, you have the right to access, rectify, port, and erase
                  your data. You also have the right to object to and restrict
                  certain processing of your data. This includes the right to
                  object to our processing of your data for direct marketing and
                  the right to object to our processing of your data where we
                  are performing a task in the public interest or pursuing our
                  legitimate interests or those of a third party.
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className='flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2 pt-4 border-t border-slate-200 dark:border-slate-700'>
          <div className='flex justify-start space-x-2 mt-3 sm:mt-0'>
            <Button
              variant='outline'
              onClick={closePreferences}
              className='border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800'
            >
              Cancel
            </Button>
            <Button onClick={savePreferences}>Save Preferences</Button>
          </div>
          <Button
            variant='default'
            onClick={acceptAll}
            className='bg-blue-600 hover:bg-blue-700 text-white'
          >
            Accept All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
