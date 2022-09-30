import { Context } from 'hono';

import { addState, getState } from './hasura';
import {
  createHash,
  escapeBase64Url,
  generateRandomString,
} from './encryption';
import { version } from '../package.json';

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

    const state = generateRandomString(32);
    const code = generateRandomString(128);
    const codeHash = await createHash(code);
    const challenge = escapeBase64Url(codeHash);
    const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${ctx.env.TWEET_CLIENT_ID}&redirect_uri=${ctx.env.CALLBACK_URL}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=${challenge}&code_challenge_method=s256`;

    await addState(ctx.env, code, state);

    return ctx.redirect(url);
  } catch (error) {
    ctx.status(500);

    return ctx.json({ error, version });
  }
};

export const handleCallback = async (ctx: Context) => {
  const request = ctx.req;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const currState = await getState(ctx.env, state);

    if (state !== currState) {
      ctx.status(400);
      return ctx.json({
        error: 'Stored tokens do not match.',
        state,
        currState,
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
