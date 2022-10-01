/* eslint-disable camelcase */
import { Context } from 'hono';

interface AccessTokenResult {
  token_type: 'bearer';
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

const authURL = 'https://api.twitter.com/2/oauth2/token';

export const authToken = async (
  ctx: Context,
  code: string,
  code_verifier: string
) => {
  const {
    CALLBACK_URL,
    TWEET_CLIENT_ID,
    TWEET_CLIENT_SECRET,
    TWEET_PASSWORD,
    TWEET_USER_ID,
  } = ctx.env;
  const redirect_uri = CALLBACK_URL;
  const client_id = TWEET_CLIENT_ID;
  const client_secret = TWEET_CLIENT_SECRET;
  const params = {
    code,
    grant_type: 'authorization_code',
    client_id,
    client_secret,
    redirect_uri,
    code_verifier,
  };
  const body = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');
  const basicToken = btoa(`${TWEET_USER_ID}:${TWEET_PASSWORD}`);

  try {
    const request = await fetch(authURL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        request
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    const response: AccessTokenResult = await request.json();

    return response;
  } catch (error) {
    console.log(`[authToken]:\n${error}`);
    throw `[authToken]:\n${error}`;
  }
};

export const refreshToken = async (ctx: Context, refresh_token: string) => {
  const {
    TWEET_CLIENT_ID,
    TWEET_CLIENT_SECRET,
    TWEET_PASSWORD,
    TWEET_USER_ID,
  } = ctx.env;
  const client_id = TWEET_CLIENT_ID;
  const client_secret = TWEET_CLIENT_SECRET;
  const basicToken = btoa(`${TWEET_USER_ID}:${TWEET_PASSWORD}`);

  try {
    const request = await fetch(authURL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token,
        grant_type: 'refresh_token',
        client_id,
        client_secret,
      }),
    });

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        request
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    const response: AccessTokenResult = await request.json();

    return response;
  } catch (error) {
    console.log(`[refreshToken]:\n${error}`);
    throw `[refreshToken]:\n${error}`;
  }
};
