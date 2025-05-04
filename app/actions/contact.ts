'use server';

import { z } from 'zod';
import nodemailer from 'nodemailer';
import { revalidatePath } from 'next/cache';

// Validation schema for contact form
const ContactFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  subject: z.string().min(1, { message: 'Please select a subject' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters long' }),
  recaptchaToken: z.string().optional(),
});

// Type for contact form data
export type ContactFormData = z.infer<typeof ContactFormSchema>;

// Function to create email transport using Hostinger SMTP
const createTransport = () => {
  // Debug password length (don't log the actual password)
  const password = process.env.EMAIL_PASSWORD || '';
  console.log('Email config debug:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    passwordLength: password.length,
    passwordFirstChar: password.charAt(0),
    passwordPrefix:
      password.length > 2 ? `${password.substring(0, 1)}...` : '[empty]',
  });

  // Create transport with debug options
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER || 'info@langai.live',
      pass: password, // Use the variable we already validated
    },
    debug: true, // Show debug output
    logger: true, // Log information into console
  });
};

/**
 * Submits the contact form and sends an email using Hostinger
 */
export async function submitContactForm(formData: FormData) {
  try {
    // Extract form data
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subjectKey = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const recaptchaToken = formData.get('recaptchaToken') as string | undefined;

    // Map subject keys to readable subjects
    const subjectMap: Record<string, string> = {
      general: 'General Inquiry',
      support: 'Technical Support',
      feedback: 'Feedback',
      partnership: 'Partnership Opportunity',
      billing: 'Billing Question',
    };

    const subjectText = subjectMap[subjectKey] || 'Contact Form Submission';

    // Validate form data
    const validatedData = ContactFormSchema.parse({
      name,
      email,
      subject: subjectKey,
      message,
      recaptchaToken,
    });

    // If reCAPTCHA is enabled, verify token
    if (process.env.RECAPTCHA_SECRET_KEY && recaptchaToken) {
      const recaptchaResponse = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        { method: 'POST' }
      );

      const recaptchaData = await recaptchaResponse.json();

      if (!recaptchaData.success) {
        return {
          success: false,
          message: 'reCAPTCHA verification failed. Please try again.',
        };
      }
    }

    // Email content
    const emailContent = {
      from: `"LangAI Contact" <${
        process.env.EMAIL_USER || 'info@langai.live'
      }>`,
      to: process.env.CONTACT_EMAIL_RECIPIENT || 'info@langai.live',
      replyTo: email,
      subject: `[LangAI Contact] ${subjectText}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subjectText}

Message:
${message}
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Subject:</strong> ${subjectText}</p>
  <p><strong>Message:</strong></p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  <p style="color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from the LangAI contact form.
  </p>
</div>
      `,
    };

    try {
      // Send email
      const transport = createTransport();

      // Verify SMTP connection before sending
      console.log('Verifying SMTP connection...');
      try {
        const connectionVerified = await transport.verify();
        console.log('SMTP Server is ready:', connectionVerified);
      } catch (error) {
        const verifyError = error as Error;
        console.error('SMTP Verification Error:', verifyError);
        throw new Error(`SMTP connection failed: ${verifyError.message}`);
      }

      // Try to send email
      console.log('Sending main email...');
      try {
        const info = await transport.sendMail(emailContent);
        console.log('Main email sent successfully!', {
          messageId: info.messageId,
          response: info.response,
        });
      } catch (error) {
        const sendError = error as Error;
        console.error('Main email sending error:', sendError);
        throw new Error(`Failed to send main email: ${sendError.message}`);
      }

      // Prepare confirmation email to the user
      const confirmationEmail = {
        from: `"LangAI" <${process.env.EMAIL_USER || 'info@langai.live'}>`,
        to: email,
        subject: `Thank you for contacting LangAI`,
        text: `
Dear ${name},

Thank you for reaching out to LangAI. We have received your message regarding "${subjectText}".

Our team will review your inquiry and get back to you as soon as possible, usually within 1-2 business days.

For your reference, here's a copy of your message:

${message}

If you have any further questions, feel free to reply to this email.

Best regards,
The LangAI Team
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Thank You for Contacting LangAI</h2>
  <p>Dear ${name},</p>
  <p>Thank you for reaching out to LangAI. We have received your message regarding "${subjectText}".</p>
  <p>Our team will review your inquiry and get back to you as soon as possible, usually within 1-2 business days.</p>
  <p>For your reference, here's a copy of your message:</p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  <p>If you have any further questions, feel free to reply to this email.</p>
  <p>Best regards,<br>The LangAI Team</p>
  <div style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
    <p>LangAI Ltd. | 16 Adrasteos Street, Strovolos, 2044, Nicosia, Cyprus</p>
  </div>
</div>
        `,
      };

      // Send confirmation email to the user
      console.log('Sending confirmation email...');
      try {
        const confirmInfo = await transport.sendMail(confirmationEmail);
        console.log('Confirmation email sent successfully!', {
          messageId: confirmInfo.messageId,
          response: confirmInfo.response,
        });
      } catch (error) {
        const confirmError = error as Error;
        console.error('Confirmation email sending error:', confirmError);
        // Don't throw here - we already sent the main email
        console.warn('Confirmation email failed but main email was sent');
      }
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      return {
        success: false,
        message: `Email sending failed: ${
          emailError.message || 'Unknown error'
        }`,
      };
    }

    // Revalidate the contact page to show success message
    revalidatePath('/contact');

    return {
      success: true,
      message:
        'Your message has been sent successfully. We will get back to you soon.',
    };
  } catch (error) {
    console.error('Contact form submission error:', error);

    if (error instanceof z.ZodError) {
      // Return validation errors
      const errorMessages = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join(', ');
      return {
        success: false,
        message: `Validation error: ${errorMessages}`,
      };
    }

    return {
      success: false,
      message:
        'There was an error submitting the contact form. Please try again later.',
    };
  }
}
