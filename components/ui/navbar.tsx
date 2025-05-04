'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, X, Globe, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useTheme } from 'next-themes';

// Navigation items definition
const navItems = [
  {
    name: 'Home',
    href: '/',
  },
  {
    name: 'Text',
    href: '/?tab=text',
  },
  {
    name: 'Voice',
    href: '/?tab=voice',
  },
  {
    name: 'Image',
    href: '/?tab=image',
  },
  {
    name: 'Document',
    href: '/?tab=document',
  },
  {
    name: 'About',
    href: '/about',
  },
  {
    name: 'Contact',
    href: '/contact',
  },
];

// The main component that uses useSearchParams wrapped in Suspense
function NavbarClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  // Check if the current path matches the navigation item
  const isActive = React.useCallback(
    (path: string) => {
      // Exact match for home page without params
      if (path === '/' && pathname === '/' && !searchParams.has('tab')) {
        return true;
      }

      // Handle tab query parameters for the home page
      if (path.startsWith('/?tab=')) {
        const tabName = path.split('=')[1];
        return pathname === '/' && searchParams.get('tab') === tabName;
      }

      // For other pages like /about, /contact, etc.
      if (!path.includes('?')) {
        return pathname === path;
      }

      return false;
    },
    [pathname, searchParams]
  );

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Desktop Navigation */}
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <div className='flex items-center gap-2'>
            <Link href='/' className='flex items-center gap-2'>
              <Globe className='h-6 w-6' />
              <span className='font-bold'>LangAI</span>
            </Link>
          </div>

          <nav className='hidden md:block'>
            <ul className='flex justify-center gap-2'>
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Actions section */}
          <div className='flex items-center'>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTheme}
              className='mr-1'
              aria-label='Toggle theme'
            >
              <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
              <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
              <span className='sr-only'>Toggle theme</span>
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant='outline' size='icon' className='md:hidden'>
                  <Menu className='h-5 w-5' />
                  <span className='sr-only'>Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side='right'
                className='md:hidden'
                title='Navigation Menu'
                description='Main navigation links for LangAI application'
              >
                <nav className='flex flex-col gap-4'>
                  <Link
                    href='/'
                    className='flex items-center gap-2 pb-4 pt-2'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Globe className='h-6 w-6' />
                    <span className='font-bold'>LangAI</span>
                  </Link>
                  <ul className='flex flex-col gap-3'>
                    {navItems.map((item) => (
                      <li key={item.name}>
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            className={`block rounded-md px-3 py-2 text-sm ${
                              isActive(item.href)
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                            }`}
                          >
                            {item.name}
                          </Link>
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Centered Mobile Navigation (Tablet and below) */}
        {/* <nav className='md:hidden overflow-x-auto py-2'>
          <ul className='flex space-x-2 justify-center whitespace-nowrap pb-1'>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`inline-flex h-8 items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav> */}
      </div>
    </header>
  );
}

// Export Navbar with Suspense
export function Navbar() {
  return (
    <React.Suspense fallback={<NavbarFallback />}>
      <NavbarClient />
    </React.Suspense>
  );
}

// Simple fallback while loading
function NavbarFallback() {
  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2'>
              <Globe className='h-6 w-6' />
              <span className='font-bold'>LangAI</span>
            </div>
          </div>
          <div className='animate-pulse h-10 w-64 bg-accent/10 rounded'></div>
          <div className='flex items-center gap-2'>
            <div className='h-9 w-9 rounded-md bg-accent/10'></div>
            <div className='md:hidden h-9 w-9 rounded-md bg-accent/10'></div>
          </div>
        </div>
      </div>
    </header>
  );
}
