import { env } from 'hono/adapter';
import { createRoute } from 'honox/factory';
import LiffProvider from '@/islands/liff';
import LocationClient from '@/islands/location';
import UserSettings from '@/islands/userSettings';

export default createRoute(async (c) => {
  const { VITE_LIFF_ID, VITE_ENV } = env<{
    VITE_LIFF_ID: string;
    VITE_ENV: string;
  }>(c);
  const mock = VITE_ENV !== 'production';
  return c.render(
    <LiffProvider liffId={VITE_LIFF_ID ?? ''} mock={mock}>
      <main className="App max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">💬 帰宅通知アプリ</h1>
        <UserSettings liffId={VITE_LIFF_ID ?? ''} mock={mock} />
        <LocationClient liffId={VITE_LIFF_ID ?? ''} mock={mock} />
      </main>
    </LiffProvider>,
  );
});
