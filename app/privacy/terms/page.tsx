import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | LangAI',
  description:
    'Terms and conditions for using LangAI translation services. Read about user responsibilities, service limitations, and legal terms.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className='container max-w-4xl py-12'>
      <h1 className='mb-8 text-4xl font-bold'>Terms & Conditions</h1>

      <div className='prose prose-slate dark:prose-invert max-w-none'>
        <p className='text-muted-foreground'>
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using LangAI ("Service"), you agree to be bound by
          these Terms and Conditions ("Terms"). If you disagree with any part of
          the terms, you may not access the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          LangAI provides machine translation services for text, documents,
          images, and voice content. The Service is designed to assist users in
          translating content between various languages using artificial
          intelligence technology.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          When you create an account with us, you must provide information that
          is accurate, complete, and current at all times. Failure to do so
          constitutes a breach of the Terms, which may result in immediate
          termination of your account.
        </p>
        <p>
          You are responsible for safeguarding the password used to access the
          Service and for any activities or actions under your password. You
          agree not to disclose your password to any third party.
        </p>

        <h2>4. User Responsibilities</h2>
        <p>
          You are responsible for the content you submit for translation. You
          agree not to use the Service to:
        </p>
        <ul>
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon the rights of others</li>
          <li>
            Submit content that is unlawful, offensive, threatening, defamatory,
            or otherwise objectionable
          </li>
          <li>Attempt to mislead others about the origin of content</li>
          <li>
            Engage in any activity that interferes with or disrupts the Service
          </li>
          <li>
            Attempt to gain unauthorized access to the Service or related
            systems
          </li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are
          owned by LangAI and are protected by international copyright,
          trademark, patent, trade secret, and other intellectual property laws.
        </p>
        <p>
          You retain all rights to the content you submit for translation.
          However, by submitting content, you grant us a worldwide,
          non-exclusive, royalty-free license to use, reproduce, and process
          that content solely for the purpose of providing the translation
          service to you.
        </p>

        <h2>6. Translation Accuracy</h2>
        <p>
          While we strive to provide accurate translations, the Service relies
          on machine learning technology that may not always produce perfect or
          contextually appropriate translations. We make no warranties regarding
          the accuracy, reliability, or quality of translations.
        </p>
        <p>
          The Service is not intended for use in situations where incorrect
          translations could lead to damage, injury, or legal violations. Users
          should verify critical translations through professional human
          translators.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          In no event shall LangAI, its directors, employees, partners, agents,
          suppliers, or affiliates be liable for any indirect, incidental,
          special, consequential, or punitive damages, including without
          limitation, loss of profits, data, or other intangible losses,
          resulting from:
        </p>
        <ul>
          <li>Your use of or inability to use the Service</li>
          <li>
            Unauthorized access to or alteration of your transmissions or data
          </li>
          <li>Statements or conduct of any third party on the Service</li>
          <li>Inaccurate or inappropriate translations</li>
          <li>Any other matter relating to the Service</li>
        </ul>

        <h2>8. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior
          notice or liability, for any reason, including without limitation if
          you breach the Terms.
        </p>
        <p>
          Upon termination, your right to use the Service will immediately
          cease. If you wish to terminate your account, you may simply
          discontinue using the Service.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. We
          will provide notice of significant changes through the Service or
          other means. Your continued use of the Service after any changes to
          the Terms constitutes acceptance of those changes.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless LangAI and its
          licensors from and against any claims, liabilities, damages, losses,
          and expenses, including without limitation reasonable attorney fees,
          arising out of or in any way connected with your access to or use of
          the Service or your violation of these Terms.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of Cyprus, without regard to its conflict of law provisions.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p>
          Email: <a href='mailto:terms@langai.live'>terms@langai.live</a>
          <br />
          Address: LangAI Ltd., Limassol, Cyprus
        </p>
      </div>
    </div>
  );
}
