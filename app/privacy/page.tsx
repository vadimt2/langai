import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LangAI Translation',
  description: 'Privacy Policy for LangAI Translation services',
};

export default function PrivacyPolicy() {
  return (
    <div className='container mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8'>Privacy Policy</h1>

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
            At LangAI, we respect your privacy and are committed to protecting
            your personal data. This privacy policy will inform you about how we
            look after your personal data when you visit our website and tell
            you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            Information We Collect
          </h2>
          <p className='mb-4'>
            We may collect, use, store, and transfer different kinds of personal
            data about you which we have grouped together as follows:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              <strong>Identity Data</strong> includes first name, last name,
              username or similar identifier.
            </li>
            <li>
              <strong>Contact Data</strong> includes email address and telephone
              numbers.
            </li>
            <li>
              <strong>Technical Data</strong> includes internet protocol (IP)
              address, your login data, browser type and version, time zone
              setting and location, browser plug-in types and versions,
              operating system and platform, and other technology on the devices
              you use to access this website.
            </li>
            <li>
              <strong>Usage Data</strong> includes information about how you use
              our website and services.
            </li>
            <li>
              <strong>Content Data</strong> includes any text, images, or
              documents you upload for translation purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            How We Use Your Information
          </h2>
          <p className='mb-4'>
            We will only use your personal data when the law allows us to. Most
            commonly, we will use your personal data in the following
            circumstances:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              To provide and maintain our service, including to monitor the
              usage of our service.
            </li>
            <li>
              To manage your account and registration as a user of the service.
            </li>
            <li>To perform the translation services you request.</li>
            <li>
              To contact you regarding updates or informative communications
              related to the features, products, or contracted services.
            </li>
            <li>To respond to inquiries and offer support.</li>
            <li>To improve our service through analysis of usage patterns.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Data Security</h2>
          <p className='mb-4'>
            We have implemented appropriate security measures to prevent your
            personal data from being accidentally lost, used, or accessed in an
            unauthorized way, altered, or disclosed. In addition, we limit
            access to your personal data to those employees, agents,
            contractors, and other third parties who have a business need to
            know.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Data Retention</h2>
          <p className='mb-4'>
            We will only retain your personal data for as long as necessary to
            fulfill the purposes we collected it for, including for the purposes
            of satisfying any legal, accounting, or reporting requirements.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Your Legal Rights</h2>
          <p className='mb-4'>
            Under certain circumstances, you have rights under data protection
            laws in relation to your personal data, including the right to:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Cookies</h2>
          <p className='mb-4'>
            We use cookies and similar tracking technologies to track the
            activity on our service and store certain information. Cookies are
            files with a small amount of data which may include an anonymous
            unique identifier.
          </p>
          <p className='mb-4'>
            You can instruct your browser to refuse all cookies or to indicate
            when a cookie is being sent. However, if you do not accept cookies,
            you may not be able to use some portions of our service.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            Changes to This Privacy Policy
          </h2>
          <p className='mb-4'>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date at the top of this page.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Contact Us</h2>
          <p className='mb-4'>
            If you have any questions about this Privacy Policy, you can contact
            us:
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
