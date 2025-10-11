import { type PropsWithChildren, useEffect } from 'hono/jsx';

export const initLiff = async (liffId: string, mock = false) => {
  const liff = (await import('@line/liff')).default;
  const { LiffMockPlugin } = await import('@line/liff-mock');
  liff.use(new LiffMockPlugin());
  await liff.init({ liffId, mock });
  if (!liff.isLoggedIn()) {
    await liff.login();
  }
  const profile = await liff.getProfile();
  return { liff, userId: profile.userId };
};

export interface Props {
  liffId: string;
  mock?: boolean;
  setMessage?: (message: string) => void;
  setError?: (error: string) => void;
}

export default function LiffProvider({
  children,
  liffId,
  mock = false,
  setMessage,
  setError,
}: PropsWithChildren<Props>) {
  useEffect(() => {
    initLiff(liffId, mock)
      .then(() => {
        setMessage?.('LIFF init succeeded.');
      })
      .catch((e: Error) => {
        console.error('LIFF init failed.');
        setMessage?.('LIFF init failed.');
        setError?.(`${e}`);
      });
  }, []);

  return <>{children}</>;
}
