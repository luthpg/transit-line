import { useEffect, useState } from 'hono/jsx';
import { Button } from '@/islands/button';
import { initLiff } from '@/islands/liff';

interface Props {
  liffId: string;
  mock?: boolean;
}

export default function UserSettings({ liffId, mock = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [destination, setDestination] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    initLiff(liffId, mock).then(async ({ userId }) => {
      setUserId(userId);
      const res = await fetch(`/api/user?userId=${userId}`);
      const { destination } = await res.json<{ destination: string }>();
      setDestination(destination);
      if (!destination || destination === '') {
        setIsOpen(true);
      }
    });
  }, []);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(userId).then(() => {
      setMessage('コピーしました！');
      setTimeout(() => setMessage(''), 2000);
    });
  };

  const handleSave = async () => {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, destination }),
    });
    if (res.ok) {
      setMessage('保存しました！');
      setTimeout(() => {
        setMessage('');
        setIsOpen(false);
      }, 2000);
    }
  };

  return (
    <div className="rounded-lg p-4 bg-gray-50">
      <button
        type="button"
        className="flex w-full justify-between items-center cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <h2 className="text-lg font-bold">⚙️ ユーザー設定</h2>
        <span
          className={`transform transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="mt-4">
          <div className="mb-4">
            <label htmlFor="user-id" className="block text-sm font-medium mb-1">
              あなたのLINE User ID
            </label>
            <div className="flex items-center gap-2">
              <input
                id="user-id"
                type="text"
                readOnly
                value={userId}
                className="px-2 py-1 border rounded-lg input input-bordered w-full"
              />
              <Button onClick={handleCopyToClipboard} className="w-20 mb-0">
                コピー
              </Button>
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="destination-id"
              className="block text-sm font-medium mb-1"
            >
              通知先 User ID
            </label>
            <input
              type="text"
              id="destination-id"
              value={destination}
              onChange={(e: any) => setDestination(e.currentTarget.value)}
              className="p-2 border rounded-lg input input-bordered w-full"
              placeholder="通知を送りたい相手のUser ID"
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            保存
          </Button>
          {message && (
            <p className="text-sm text-green-500 mt-2 text-center">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
