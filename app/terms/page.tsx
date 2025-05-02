import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | LangAI Translation',
  description: 'Terms and conditions for using LangAI Translation services',
};

export default function TermsAndConditions() {
  return (
    <div className='container mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8'>Terms and Conditions</h1>

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
            Welcome to LangAI. These terms and conditions govern your use of our
            website and translation services. By accessing our website or using
            our services, you agree to these terms. If you disagree with any
            part of these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Use of Services</h2>
          <p className='mb-4'>
            Our translation services are provided for personal and commercial
            use subject to these terms. You may use our services to translate
            text, documents, and images between supported languages.
          </p>
          <p className='mb-4'>In using our services, you agree not to:</p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              Use our services for any illegal purpose or in violation of any
              local, state, national, or international law
            </li>
            <li>
              Violate or infringe on the intellectual property rights of others
            </li>
            <li>
              Submit content that is offensive, harmful, threatening, abusive,
              defamatory, or otherwise objectionable
            </li>
            <li>
              Attempt to interfere with, compromise the system integrity or
              security, or decipher any transmissions to or from the servers
              running our service
            </li>
            <li>
              Use automated means, including spiders, robots, crawlers, or
              similar technologies, to access our services
            </li>
            <li>
              Impose an unreasonable or disproportionately large load on our
              infrastructure
            </li>
            <li>
              Upload invalid data, viruses, worms, or other software agents
              through our service
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Translation Quality</h2>
          <p className='mb-4'>
            While we strive to provide accurate translations, we cannot
            guarantee that all translations will be perfect. Translation quality
            may vary depending on the complexity of the content, language pairs,
            and technical limitations.
          </p>
          <p className='mb-4'>
            Our service uses automated machine translation technology which,
            despite being advanced, may occasionally produce:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>Grammatical errors or awkward phrasing</li>
            <li>Misinterpretation of idiomatic expressions</li>
            <li>Inaccuracies in specialized terminology</li>
            <li>Errors in context-dependent translations</li>
          </ul>
          <p className='mb-4'>
            For critical or professional translations, we recommend reviewing
            the output carefully or consulting with a human translator.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Intellectual Property</h2>
          <p className='mb-4'>
            Our website, logo, and the translation technology we use are owned
            by us and protected by intellectual property laws. You may not use,
            reproduce, distribute, or create derivative works based on our
            proprietary technology without our express permission.
          </p>
          <p className='mb-4'>
            You retain all rights to the content you submit for translation.
            However, by submitting content, you grant us a non-exclusive,
            worldwide license to use your content for the purpose of providing
            our translation services to you.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Privacy and Data</h2>
          <p className='mb-4'>
            Our handling of your data is governed by our Privacy Policy, which
            is incorporated into these Terms by reference. By using our
            services, you consent to the collection and use of information as
            detailed in our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            Limitation of Liability
          </h2>
          <p className='mb-4'>
            To the maximum extent permitted by law, in no event shall LangAI, or
            our suppliers, partners, or affiliates, be liable for:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>
              Any indirect, incidental, special, consequential, or punitive
              damages, including lost profits, lost data, or business
              interruption
            </li>
            <li>
              Any damages resulting from inaccurate translations or
              misinterpretations
            </li>
            <li>
              Any damages resulting from unauthorized access to or use of our
              services
            </li>
            <li>
              Any damages resulting from any errors or omissions in any content
              or information provided by the service
            </li>
          </ul>
          <p className='mb-4'>
            Our liability is limited to the maximum extent permitted by law, and
            shall not exceed the amount paid by you, if any, for using our
            services.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Indemnification</h2>
          <p className='mb-4'>
            You agree to indemnify, defend and hold harmless LangAI, our
            affiliates, partners, officers, directors, agents, and employees
            from and against any and all claims, liabilities, damages, losses,
            costs, expenses, or fees (including reasonable attorneys' fees) that
            arise from or relate to:
          </p>
          <ul className='list-disc pl-6 mb-4 space-y-2'>
            <li>Your use or misuse of our services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another person or entity</li>
            <li>Your content submitted for translation</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>
            Modifications to Terms
          </h2>
          <p className='mb-4'>
            We reserve the right to modify these Terms at any time. We will
            provide notice of significant changes by posting the updated Terms
            on our website and updating the "Last Updated" date. Your continued
            use of our services after any such changes constitutes your
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Governing Law</h2>
          <p className='mb-4'>
            These Terms shall be governed by and construed in accordance with
            the laws of Cyprus, without regard to its conflict of laws
            principles. Any disputes arising under or in connection with these
            Terms shall be subject to the exclusive jurisdiction of the courts
            of Cyprus.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Contact Us</h2>
          <p className='mb-4'>
            If you have any questions about these Terms, please contact us:
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
