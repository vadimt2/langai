'use client';

import Link from 'next/link';
import {
  footerLinks,
  type FooterSection,
  type FooterLink,
} from '../data/site-config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t bg-background'>
      <div className='container mx-auto max-w-7xl px-6 py-8 md:py-12'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4'>
          {/* Company Info */}
          <div>
            <h3 className='mb-4 text-base font-medium'>LangAI</h3>
            <p className='text-sm text-muted-foreground'>
              Providing advanced AI translation solutions
              <br />
              Based in Cyprus
            </p>
          </div>

          {/* Dynamic Footer Sections */}
          {footerLinks.map((section: FooterSection) => (
            <div key={section.title}>
              <h3 className='mb-4 text-base font-medium'>{section.title}</h3>
              <ul className='space-y-3 text-sm'>
                {section.links.map((link: FooterLink) => (
                  <li key={link.title}>
                    {link.external ? (
                      <a
                        href={link.url}
                        className='text-muted-foreground transition-colors hover:text-foreground'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {link.title}
                      </a>
                    ) : (
                      <Link
                        href={link.url}
                        className='text-muted-foreground transition-colors hover:text-foreground'
                      >
                        {link.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className='mb-4 text-base font-medium'>Contact</h3>
            <ul className='space-y-3 text-sm'>
              <li className='text-muted-foreground'>
                Email:{' '}
                <a
                  href='mailto:info@langai.live'
                  className='transition-colors hover:text-foreground'
                >
                  info@langai.live
                </a>
              </li>
              <li className='text-muted-foreground'>
                <a
                  href='https://langai.live'
                  className='transition-colors hover:text-foreground'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  https://langai.live
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-10 border-t pt-8'>
          <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
            <p className='text-sm text-muted-foreground'>
              &copy; {currentYear} LangAI. All rights reserved.
            </p>

            {/* <div className='flex items-center space-x-6'>
              <a
                href='https://twitter.com/langai'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Twitter'
                className='text-muted-foreground transition-colors hover:text-foreground'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='18'
                  height='18'
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
                href='https://github.com/langai'
                target='_blank'
                rel='noopener noreferrer'
                aria-label='GitHub'
                className='text-muted-foreground transition-colors hover:text-foreground'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4'></path>
                  <path d='M9 18c-4.51 2-5-2-7-2'></path>
                </svg>
              </a>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
