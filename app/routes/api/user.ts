import { createRoute } from 'honox/factory';

export const GET = createRoute(async (c) => {
  const userId = c.req.query('userId');
  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }
  const [homeStation, destination] = await Promise.all([
    c.env.TRAIN_LINE.get<string>(`user:${userId}:homeStation`),
    c.env.TRAIN_LINE.get<string>(`user:${userId}:destination`),
  ]);
  return c.json({
    homeStation: homeStation || '',
    destination: destination || '',
  });
});

export const POST = createRoute(async (c) => {
  const { userId, homeStation, destination } = await c.req.json<{
    userId: string;
    homeStation?: string;
    destination?: string;
  }>();
  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }
  if (homeStation) {
    await c.env.TRAIN_LINE.put(`user:${userId}:homeStation`, homeStation);
  }
  if (destination) {
    await c.env.TRAIN_LINE.put(`user:${userId}:destination`, destination);
  }
  return c.json({ success: true });
});
