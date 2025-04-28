import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 60,
          color: 'white',
          background: 'linear-gradient(to bottom, #3b82f6, #1e40af)',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: 40,
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20 }}>
          LangAI
        </div>
        <div style={{ fontSize: 40, marginBottom: 40, opacity: 0.9 }}>
          AI Translation App
        </div>
        <div style={{ fontSize: 36, maxWidth: '80%' }}>
          Translate text and voice between languages using AI
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
