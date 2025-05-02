import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-gray-50 border-t'>
      <div className='container mx-auto py-6 px-4'>
        <div className='flex flex-col md:flex-row justify-between items-center'>
          <div className='mb-4 md:mb-0'>
            <p className='text-gray-600 text-sm'>
              © {currentYear} LangAI. All rights reserved.
            </p>
          </div>

          <nav aria-label='Footer Navigation'>
            <ul className='flex space-x-6'>
              <li>
                <Link
                  href='/privacy'
                  className='text-gray-600 hover:text-gray-900 text-sm transition-colors'
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/terms'
                  className='text-gray-600 hover:text-gray-900 text-sm transition-colors'
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
