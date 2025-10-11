import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  return c.text('ok', 200);
});
