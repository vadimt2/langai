'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRecaptchaContext } from '@/context/recaptcha-context';
import { submitContactForm } from '@/app/actions/contact';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validation schema
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Please select a subject' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters long' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formSuccess, setFormSuccess] = React.useState(false);
  const [formError, setFormError] = React.useState('');
  const { isLoaded: isRecaptchaLoaded, getToken } = useRecaptchaContext();

  // Initialize react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setFormError('');

    try {
      // Build FormData object for server action
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('subject', data.subject);
      formData.append('message', data.message);

      // Add reCAPTCHA token if available
      if (isRecaptchaLoaded) {
        try {
          const token = await getToken('contact_form');
          if (token) {
            formData.append('recaptchaToken', token);
          }
        } catch (error) {
          console.error('Error getting reCAPTCHA token:', error);
        }
      }

      // Submit the form using the server action
      const result = await submitContactForm(formData);

      if (result.success) {
        // Show success message and reset form
        setFormSuccess(true);
        form.reset();
        toast({
          title: 'Message Sent',
          description: result.message,
        });
      } else {
        // Show error message
        setFormError(
          result.message || 'Something went wrong. Please try again.'
        );
        toast({
          title: 'Error',
          description:
            result.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setFormError('An unexpected error occurred. Please try again later.');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {formSuccess ? (
        <Alert className='bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 mb-6'>
          <AlertDescription className='text-green-800 dark:text-green-200'>
            Your message has been sent successfully. We will get back to you
            soon.
          </AlertDescription>
        </Alert>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {formError && (
              <Alert className='bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'>
                <AlertDescription className='text-red-800 dark:text-red-200'>
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Your name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='your.email@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='subject'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a subject' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='general'>General Inquiry</SelectItem>
                      <SelectItem value='support'>Technical Support</SelectItem>
                      <SelectItem value='feedback'>Feedback</SelectItem>
                      <SelectItem value='partnership'>
                        Partnership Opportunity
                      </SelectItem>
                      <SelectItem value='billing'>Billing Question</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='message'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Your message...'
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
