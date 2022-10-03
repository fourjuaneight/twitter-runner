import { Context } from 'hono';

import { addData, getData, State, Tokens } from './hasura';
import { authToken, refreshToken } from './twitter';
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
    const user = searchParams.get('user');

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
    // DOCS: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
    const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${ctx.env.TWEET_CLIENT_ID}&redirect_uri=${ctx.env.CALLBACK_URL}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=${challenge}&code_challenge_method=s256`;

    await addData<State>(ctx.env, 'state', 'mutation', {
      codeVerifier: code,
      state,
      user,
    });

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
    const currState = await getData<State>(ctx.env, 'state', 'search', {
      codeVerifier: code,
      state,
      user,
    });

    if (state !== currState.state) {
      ctx.status(400);
      return ctx.json({
        error: 'Stored tokens do not match.',
        state,
        currState: currState.state,
        version,
      });
    }

    const tokens = await authToken(
      ctx,
      code,
      currState.codeVerifier,
      currState.user
    );
    await addData<Tokens>(ctx.env, 'tokens', 'mutation', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
      user: currState.user ?? '',
    });

    ctx.status(200);

    return ctx.json({ accessToken: tokens.access_token, version });
  } catch (error) {
    ctx.status(500);

    return ctx.json({ error, version });
  }
};

export const handleAccess = async (ctx: Context) => {
  const accessKey = ctx.env.ACCESS_KEY;
  const request = ctx.req;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const user = searchParams.get('user');

    if (!key) {
      ctx.status(400);
      return ctx.json({
        error: "Missing 'Key' header.",
        version,
      });
    }
    if (key !== accessKey) {
      ctx.status(400);
      return ctx.json({
        error: "You're not authorized to access this API.",
        version,
      });
    }

    const currTokens = await getData<Tokens>(ctx.env, 'tokens', 'query', {
      accessToken: '',
      refreshToken: '',
      user,
    });

    ctx.status(200);

    return ctx.json({
      accessToken: currTokens.accessToken,
      refreshToken: currTokens.refreshToken,
      version,
    });
  } catch (error) {
    ctx.status(500);

    return ctx.json({ error, version });
  }
};

export const handleRefresh = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;
  const request = ctx.req;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const token = searchParams.get('token');
    const user = searchParams.get('user');

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

    const currTokens = await getData<Tokens>(ctx.env, 'tokens', 'search', {
      accessToken: token,
      refreshToken: '',
      user,
    });
    const tokens = await refreshToken(ctx, currTokens.refreshToken, user);
    await addData<Tokens>(ctx.env, 'tokens', 'mutation', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
      user,
    });

    ctx.status(200);

    return ctx.json({ accessToken: tokens.access_token, version });
  } catch (error) {
    ctx.status(500);

    return ctx.json({ error, version });
  }
};
