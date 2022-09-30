import { Context } from 'hono';

import { addState } from './hasura';

export const handleAuth = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;
  const request = ctx.req;

  try {
    const { searchParams } = new URL(request.url);

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

    const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${ctx.env.TWEET_CLIENT_ID}&redirect_uri=${ctx.env.CALLBACK_URL}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=state&code_challenge=challenge&code_challenge_method=plain`;

    ctx.status(200);

    return ctx.json({ url });
  } catch (error) {
    ctx.status(500);

    return ctx.json({ error, version });
  }
};

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
