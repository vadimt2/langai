'use client';

import { useState } from 'react';
import { useConsent } from './consent-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConsentPreferences() {
  const {
    showPreferences,
    closePreferences,
    updateConsent,
    acceptAll,
    consent,
  } = useConsent();

  const [localConsent, setLocalConsent] = useState({ ...consent });

  // Reset local consent state when modal opens
  useState(() => {
    if (showPreferences) {
      setLocalConsent({ ...consent });
    }
  });

  const handleToggle = (key: keyof typeof localConsent) => {
    // Don't allow toggling necessary cookies off
    if (key === 'necessary') return;

    setLocalConsent((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateConsent(localConsent);
    closePreferences();
  };

  return (
    <Dialog open={showPreferences} onOpenChange={closePreferences}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Customize your cookie preferences. Necessary cookies are always
            enabled as they are essential for the website to function properly.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='flex items-start space-x-3'>
            <Checkbox id='necessary' checked={true} disabled={true} />
            <div className='space-y-1 leading-none'>
              <label
                htmlFor='necessary'
                className='font-medium text-sm cursor-default'
              >
                Necessary cookies
              </label>
              <p className='text-xs text-gray-500'>
                These cookies are essential for the website to function properly
                and cannot be disabled.
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <Checkbox
              id='analytics'
              checked={localConsent.analytics}
              onCheckedChange={() => handleToggle('analytics')}
            />
            <div className='space-y-1 leading-none'>
              <label
                htmlFor='analytics'
                className='font-medium text-sm cursor-pointer'
              >
                Analytics cookies
              </label>
              <p className='text-xs text-gray-500'>
                These cookies help us understand how visitors interact with the
                website, providing insights that help us improve our services.
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <Checkbox
              id='marketing'
              checked={localConsent.marketing}
              onCheckedChange={() => handleToggle('marketing')}
            />
            <div className='space-y-1 leading-none'>
              <label
                htmlFor='marketing'
                className='font-medium text-sm cursor-pointer'
              >
                Marketing cookies
              </label>
              <p className='text-xs text-gray-500'>
                These cookies are used to track visitors across websites to
                display relevant advertisements.
              </p>
            </div>
          </div>

          <div className='flex items-start space-x-3'>
            <Checkbox
              id='preferences'
              checked={localConsent.preferences}
              onCheckedChange={() => handleToggle('preferences')}
            />
            <div className='space-y-1 leading-none'>
              <label
                htmlFor='preferences'
                className='font-medium text-sm cursor-pointer'
              >
                Preference cookies
              </label>
              <p className='text-xs text-gray-500'>
                These cookies enable the website to remember choices you make
                and provide enhanced, personalized features.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className='sm:justify-between'>
          <Button type='button' variant='outline' onClick={acceptAll}>
            Accept All
          </Button>
          <div className='flex space-x-2'>
            <Button type='button' variant='outline' onClick={closePreferences}>
              Cancel
            </Button>
            <Button type='button' onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
