import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found - LangAI',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className='container mx-auto flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center'>
      <h1 className='text-6xl font-bold mb-6'>404</h1>
      <h2 className='text-2xl font-medium mb-6'>Page Not Found</h2>
      <p className='text-muted-foreground mb-8 max-w-md'>
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link
        href='/'
        className='bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md text-sm font-medium'
      >
        Go to Home Page
      </Link>
    </div>
  );
}
