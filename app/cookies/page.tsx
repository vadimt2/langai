import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | LangAI Translation',
  description:
    'Cookie Policy for LangAI Translation services explaining how we use cookies and similar technologies',
};

export default function CookiePolicy() {
  return (
    <div className='container mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8'>Cookie Policy</h1>

      <div className='space-y-8'>
        <section>
          <h2 className='text-2xl font-semibold mb-4'>Introduction</h2>
          <p className='mb-4'>
            Last Updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className='mb-4'>
            This Cookie Policy explains how LangAI ("we", "us", or "our") uses
            cookies and similar technologies on our website. It explains what
            these technologies are and why we use them, as well as your rights
            to control our use of them.
          </p>
          <p className='mb-4'>
            Please read this Cookie Policy carefully. By continuing to browse or
            use our website, you agree to our use of cookies as described in
            this policy.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>What Are Cookies</h2>
          <p className='mb-4'>
            Cookies are small text files that are stored on your computer or
            mobile device when you visit a website. They are widely used to make
            websites work more efficiently and provide information to the
            website owners.
          </p>
          <p className='mb-4'>
            Cookies can be "persistent" or "session" cookies. Persistent cookies
            remain on your device when you go offline, while session cookies are
            deleted as soon as you close your web browser.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>How We Use Cookies</h2>
          <p className='mb-4'>
            We use cookies for several reasons. Some cookies are required for
            technical reasons for our website to operate, while others enable us
            to track and target the interests of our users to enhance their
            experience on our site.
          </p>
          <p className='mb-4'>The specific types of cookies we use include:</p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              <strong>Essential Cookies:</strong> These cookies are necessary
              for the website to function properly. They enable core
              functionality such as security, network management, and account
              access. You may disable these by changing your browser settings,
              but this may affect how the website functions.
            </li>
            <li>
              <strong>Preference Cookies:</strong> These cookies enable our
              website to remember information that changes the way the website
              behaves or looks, such as your preferred language or the region
              you are in. They help us to remember your settings and
              preferences.
            </li>
            <li>
              <strong>Analytical/Performance Cookies:</strong> These cookies
              allow us to count visits and traffic sources so we can measure and
              improve the performance of our site. They help us to know which
              pages are the most and least popular and see how visitors move
              around the site.
            </li>
            <li>
              <strong>Marketing Cookies:</strong> These cookies record your
              visit to our website, the pages you have visited, and the links
              you have followed. We use this information to make our website and
              the advertising displayed on it more relevant to your interests.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Third-Party Cookies</h2>
          <p className='mb-4'>
            In addition to our own cookies, we may also use various third-party
            cookies to report usage statistics of the service and deliver
            advertisements on and through the service.
          </p>
          <p className='mb-4'>These third-party services include:</p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              <strong>Google Analytics:</strong> We use Google Analytics to
              analyze the use of our website. Google Analytics gathers
              information about website use by means of cookies. The information
              gathered is used to create reports about the use of our website.
            </li>
            <li>
              <strong>ReCAPTCHA:</strong> We use Google reCAPTCHA to protect our
              forms from spam and abuse. This service uses cookies to identify
              legitimate users from bots.
            </li>
            <li>
              <strong>Social Media:</strong> If you share our content through
              social media, such as Facebook or Twitter, these services may set
              cookies that can identify you. We don't control the setting of
              these cookies, so please check the respective privacy policy of
              each service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Consent for Cookies</h2>
          <p className='mb-4'>
            When you first visit our website, you will be presented with a
            cookie consent banner. By clicking "Accept All Cookies", you are
            giving us your consent to use all cookies as described in this
            policy. If you choose to "Customize Settings", you can selectively
            consent to different types of cookies.
          </p>
          <p className='mb-4'>
            You can change your cookie preferences at any time by clicking on
            the "Cookie Settings" link in the footer of our website.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Your Cookie Choices</h2>
          <p className='mb-4'>
            You have the right to decide whether to accept or reject cookies.
            You can exercise your cookie preferences by clicking on the "Cookie
            Settings" option in the footer of our website.
          </p>
          <p className='mb-4'>
            You can also set or amend your web browser controls to accept or
            refuse cookies. Most browsers automatically accept cookies, but you
            can usually modify your browser setting to decline cookies if you
            prefer. If you choose to decline cookies, you may not be able to use
            some portions of our service.
          </p>
          <p className='mb-4'>
            Here are links to the cookie settings in common web browsers:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              <a
                href='https://support.google.com/chrome/answer/95647'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href='https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href='https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                Safari
              </a>
            </li>
            <li>
              <a
                href='https://support.microsoft.com/en-us/windows/delete-and-manage-cookies-168dab11-0753-043d-7c16-ede5947fc64d'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline'
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            How Long Will Cookies Stay on My Device
          </h2>
          <p className='mb-4'>
            The length of time a cookie will remain on your device depends on
            whether it is a "persistent" or "session" cookie. Session cookies
            will remain on your device until you stop browsing. Persistent
            cookies remain on your device until they expire or are deleted.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            Updates to This Cookie Policy
          </h2>
          <p className='mb-4'>
            We may update this Cookie Policy from time to time to reflect
            changes to the cookies we use or for other operational, legal, or
            regulatory reasons. Please revisit this Cookie Policy regularly to
            stay informed about our use of cookies and related technologies.
          </p>
          <p className='mb-4'>
            The date at the top of this Cookie Policy indicates when it was last
            updated.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Contact Us</h2>
          <p className='mb-4'>
            If you have any questions about our use of cookies or this Cookie
            Policy, please contact us:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>By email: support@langai.live</li>
            <li>By visiting our website: https://langai.live/contact</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
