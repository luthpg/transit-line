export const getUserHomeStation = async (userId: string): Promise<string> => {
  if (!userId) return '';
  const res = await fetch(`/api/user?userId=${userId}`);
  const { homeStation } = await res.json<{ homeStation: string }>();
  return homeStation;
};

export const saveUserHomeStation = async (
  userId: string,
  homeStation: string,
): Promise<void> => {
  await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, homeStation }),
  });
};
