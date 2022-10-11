import { Context } from 'hono';

import {
  addData,
  addPrompt,
  getData,
  getPrompts,
  State,
  Tokens,
} from './hasura';
import {
  authToken,
  details,
  refreshToken,
  revokeToken,
  tweet,
} from './twitter';
import {
  createHash,
  escapeBase64Url,
  generateRandomString,
} from './encryption';
import { version } from '../package.json';

interface AuthPayload {
  key: string;
  token: string;
  user: string;
}

interface TweetPayload extends AuthPayload {
  body: string;
}

interface PromptPayload {
  key: string;
  table: string;
  prompt: string;
}

interface DetailsPayload {
  key: string;
  id: string;
}

export const handleAuth = async (ctx: Context) => {
  const { AUTH_KEY, CALLBACK_URL, TWT_CLIENT_ID_0, TWT_CLIENT_ID_1 } = ctx.env;
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
    if (key !== AUTH_KEY) {
      ctx.status(400);
      return ctx.json({
        error: "You're not authorized to access this API.",
        version,
      });
    }

    const clientID = user === '0' ? TWT_CLIENT_ID_0 : TWT_CLIENT_ID_1;
    const state = generateRandomString(32);
    const code = generateRandomString(128);
    const codeHash = await createHash(code);
    const challenge = escapeBase64Url(codeHash);
    // DOCS: https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code
    const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientID}&redirect_uri=${CALLBACK_URL}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${state}&code_challenge=${challenge}&code_challenge_method=s256`;

    await addData<State>(ctx, 'state', 'mutation', {
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
    const currState = await getData<State>(ctx, 'state', 'search', {
      codeVerifier: code,
      state,
      user: 0,
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

    const newTokens = await authToken(
      ctx,
      code,
      currState.codeVerifier,
      currState.user,
    );
    await addData<Tokens>(ctx, 'tokens', 'mutation', {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? '',
      user: currState.user ?? '',
    });

    ctx.status(200);

    return ctx.json({
      accessToken: newTokens.access_token,
      expires: newTokens.expires_in,
      version,
    });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
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

    const currTokens = await getData<Tokens>(ctx, 'tokens', 'query', {
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
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};

export const handleRefresh = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;

  try {
    const { key, token, user } = await ctx.req.json<AuthPayload>();

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

    const currTokens = await getData<Tokens>(ctx, 'tokens', 'search', {
      accessToken: token,
      refreshToken: '',
      user,
    });
    const newTokens = await refreshToken(ctx, currTokens.refreshToken, user);
    await addData<Tokens>(ctx, 'tokens', 'mutation', {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? '',
      user,
    });

    ctx.status(200);

    return ctx.json({ accessToken: newTokens.access_token, version });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};

export const handleRevoke = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;

  try {
    const { key, token, user } = await ctx.req.json<AuthPayload>();

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

    await revokeToken(ctx, token, user);

    ctx.status(200);

    return ctx.json({
      success: `Token '${token}' successfully revoked.`,
      version,
    });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};

export const handleTweet = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;

  try {
    const { key, token, user, body } = await ctx.req.json<TweetPayload>();

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

    const newTokens = await refreshToken(ctx, token, user);

    await addData<Tokens>(ctx, 'tokens', 'mutation', {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? '',
      user,
    });

    const post = await tweet(newTokens.access_token, body);

    ctx.status(200);

    return ctx.json({
      success: 'Tweet posted and token refreshed.',
      accessToken: newTokens.access_token,
      id: post,
      version,
    });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};

export const handlePrompt = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;

  try {
    const { key, table, prompt } = await ctx.req.json<PromptPayload>();

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

    const newPrompt = await addPrompt(ctx, table, prompt);

    ctx.status(200);

    return ctx.json({
      success: 'Prompt saved successfully.',
      id: newPrompt,
      version,
    });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};

export const handlePromptsList = async (ctx: Context) => {
  const accessKey = ctx.env.ACCESS_KEY;
  const request = ctx.req;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const table = searchParams.get('table');

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

    const prompts = await getPrompts(ctx, table);

    ctx.status(200);

    return ctx.json({
      prompts,
      version,
    });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};

export const handleDetails = async (ctx: Context) => {
  const authKey = ctx.env.AUTH_KEY;

  try {
    const { key, id } = await ctx.req.json<DetailsPayload>();

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

    const tweetDetails = await details(ctx, id);

    ctx.status(200);

    return ctx.json({
      success: tweetDetails,
      details,
      version,
    });
  } catch (error) {
    ctx.status(500);
    console.log({ error, version });
    return ctx.json({ error, version });
  }
};
