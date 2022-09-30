import { Context } from 'hono';

import { addState } from './hasura';

export const handleCallback = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;
  const request = ctx.req;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const key = searchParams.get('key');

    if (!key) {
      ctx.status(400);
      return ctx.json({
        error: "Missing 'Key' header.",
        version,
      });
    }
    if (key !== authKey) {
      ctx.status(400);
      return ctx.json({
        error: "You're not authorized to access this API.",
        version,
      });
    }

    const id = await addState(ctx.env, code, state);

    ctx.status(200);

    return ctx.json({ id, state, code });
  } catch (error) {
    ctx.status(500);

    return ctx.json({ error, version });
  }
};
