import { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from './contact-form';

export const metadata: Metadata = {
  title: 'Contact Us | LangAI Translation',
  description:
    'Get in touch with LangAI for support, inquiries, or partnership opportunities',
};

export default function ContactPage() {
  return (
    <div className='container mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8'>Contact Us</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-12'>
        <section>
          <h2 className='text-2xl font-semibold mb-6'>Get in Touch</h2>
          <p className='mb-6'>
            Have questions, feedback, or need assistance with our translation
            services? We'd love to hear from you. Fill out the form below, and
            our team will get back to you as soon as possible.
          </p>

          <ContactForm />
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-6'>Contact Information</h2>
          <div className='space-y-8'>
            <div>
              <h3 className='text-lg font-medium mb-2'>Email</h3>
              <p className='text-muted-foreground mb-1'>
                General Inquiries:{' '}
                <a
                  href='mailto:info@langai.live'
                  className='text-primary hover:underline'
                >
                  info@langai.live
                </a>
              </p>
              <p className='text-muted-foreground mb-1'>
                Support:{' '}
                <a
                  href='mailto:support@langai.live'
                  className='text-primary hover:underline'
                >
                  support@langai.live
                </a>
              </p>
              <p className='text-muted-foreground'>
                Business Partnerships:{' '}
                <a
                  href='mailto:partnerships@langai.live'
                  className='text-primary hover:underline'
                >
                  partnerships@langai.live
                </a>
              </p>
            </div>

            <div>
              <h3 className='text-lg font-medium mb-2'>Headquarters</h3>
              <address className='text-muted-foreground not-italic'>
                LangAI Ltd.
                <br />
                16 Adrasteos Street
                <br />
                Strovolos, 2044
                <br />
                Nicosia, Cyprus
              </address>
            </div>

            <div>
              <h3 className='text-lg font-medium mb-2'>Operating Hours</h3>
              <p className='text-muted-foreground'>
                Monday - Friday: 9:00 AM - 6:00 PM (EET)
                <br />
                Saturday: 10:00 AM - 2:00 PM (EET)
                <br />
                Sunday: Closed
              </p>
            </div>

            {/* <div>
              <h3 className='text-lg font-medium mb-2'>Follow Us</h3>
              <div className='flex space-x-4'>
                <a
                  href='https://twitter.com/langai'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-primary'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z'></path>
                  </svg>
                </a>
                <a
                  href='https://www.facebook.com/langai'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-primary'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'></path>
                  </svg>
                </a>
                <a
                  href='https://www.linkedin.com/company/langai'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-muted-foreground hover:text-primary'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z'></path>
                    <rect x='2' y='9' width='4' height='12'></rect>
                    <circle cx='4' cy='4' r='2'></circle>
                  </svg>
                </a>
              </div>
            </div> */}
          </div>

          <div className='mt-12 p-6 bg-muted rounded-lg'>
            <h3 className='text-lg font-medium mb-4'>Quick Links</h3>
            <ul className='space-y-2'>
              <li>
                <Link href='/about' className='text-primary hover:underline'>
                  About Us
                </Link>
              </li>
              <li>
                <Link href='/privacy' className='text-primary hover:underline'>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href='/terms' className='text-primary hover:underline'>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href='/cookies' className='text-primary hover:underline'>
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
