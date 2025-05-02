import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | LangAI Translation',
  description:
    'Learn about LangAI, our mission, and the technology behind our AI-powered translation services',
};

export default function AboutPage() {
  return (
    <div className='container mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-8'>About LangAI</h1>

      <div className='space-y-12'>
        <section>
          <h2 className='text-2xl font-semibold mb-4'>Our Mission</h2>
          <p className='mb-4'>
            At LangAI, we believe language should never be a barrier to
            communication, knowledge, or opportunity. Our mission is to break
            down language barriers by providing advanced, accessible translation
            services powered by cutting-edge AI technology.
          </p>
          <p className='mb-4'>
            We envision a world where anyone can communicate freely and
            effectively in any language, whether they're traveling abroad,
            conducting business internationally, consuming content, or building
            relationships across cultures.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Our Story</h2>
          <p className='mb-4'>
            LangAI was founded in 2025  by a team of language enthusiasts, AI
            researchers, and global communication experts who recognized the
            limitations of existing translation services. Drawing on their
            collective experience in linguistics, machine learning, and software
            development, they set out to create a more accurate, context-aware
            translation platform.
          </p>
          <p className='mb-4'>
            Starting with text translation and quickly expanding to voice,
            image, and document translation, LangAI has grown to support over
            100 languages and dialects, making it one of the most comprehensive
            translation services available today.
          </p>
          <p className='mb-4'>
            Based in Cyprus, our diverse team now includes talent from across
            Europe, Asia, and the Americas, bringing together a wealth of
            cultural and linguistic expertise.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Our Technology</h2>
          <p className='mb-4'>
            LangAI leverages the latest advancements in artificial intelligence
            and natural language processing to deliver translations that capture
            not just the words, but the context, tone, and cultural nuances of
            the original content.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            <div className='bg-muted p-6 rounded-lg'>
              <h3 className='text-xl font-medium mb-3'>
                Neural Machine Translation
              </h3>
              <p>
                Our core translation engine uses advanced neural networks
                trained on billions of multilingual texts to understand and
                generate natural-sounding translations that preserve meaning
                across languages.
              </p>
            </div>
            <div className='bg-muted p-6 rounded-lg'>
              <h3 className='text-xl font-medium mb-3'>Context Awareness</h3>
              <p>
                Unlike conventional translation tools, LangAI analyzes the full
                context of your content to ensure accurate translations that
                maintain the original intent and tone, even with complex
                idiomatic expressions.
              </p>
            </div>
            <div className='bg-muted p-6 rounded-lg'>
              <h3 className='text-xl font-medium mb-3'>
                Multimodal Understanding
              </h3>
              <p>
                Our technology can process and translate text across various
                formats—from typed messages to text embedded in images and
                complex document layouts—maintaining formatting and design
                elements.
              </p>
            </div>
            <div className='bg-muted p-6 rounded-lg'>
              <h3 className='text-xl font-medium mb-3'>Continuous Learning</h3>
              <p>
                LangAI continuously improves through machine learning processes
                that analyze user feedback and translation patterns, making our
                service increasingly accurate and culturally sensitive over
                time.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Our Values</h2>
          <ul className='list-disc pl-6 space-y-3'>
            <li>
              <strong>Accuracy:</strong> We prioritize precision in our
              translations, understanding that miscommunications can have
              significant consequences.
            </li>
            <li>
              <strong>Accessibility:</strong> We believe advanced translation
              technology should be accessible to everyone, regardless of
              technical expertise or resources.
            </li>
            <li>
              <strong>Privacy:</strong> We respect the confidentiality of your
              content and maintain strict data protection standards.
            </li>
            <li>
              <strong>Cultural Sensitivity:</strong> We recognize the importance
              of cultural context in communication and strive to preserve
              cultural nuances in translation.
            </li>
            <li>
              <strong>Innovation:</strong> We continuously pursue advancements
              in AI and linguistics to improve our services and expand what's
              possible in machine translation.
            </li>
          </ul>
        </section>

        {/* <section>
          <h2 className='text-2xl font-semibold mb-4'>Our Team</h2>
          <p className='mb-6'>
            LangAI is powered by a diverse team of linguists, engineers, data
            scientists, and customer support specialists who share a passion for
            breaking down language barriers and enabling global communication.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4'></div>
              <h3 className='font-semibold text-lg'>Alex Demetriou</h3>
              <p className='text-muted-foreground'>Founder & CEO</p>
            </div>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4'></div>
              <h3 className='font-semibold text-lg'>Maria Chen</h3>
              <p className='text-muted-foreground'>Chief Technology Officer</p>
            </div>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4'></div>
              <h3 className='font-semibold text-lg'>David Navarro</h3>
              <p className='text-muted-foreground'>Chief Linguistics Officer</p>
            </div>
          </div>
        </section> */}

        <section>
          <h2 className='text-2xl font-semibold mb-4'>Join Us</h2>
          <p className='mb-4'>
            We're always looking for talented individuals who share our passion
            for languages, technology, and global communication. Visit our
            careers page to learn about current opportunities.
          </p>
          <p className='mb-4'>
            If you have questions or would like to learn more about LangAI,
            please{' '}
            <a href='/contact' className='text-primary hover:underline'>
              contact us
            </a>
            . We'd love to hear from you!
          </p>
        </section>
      </div>
    </div>
  );
}
