/* eslint-disable camelcase */
import { Context } from 'hono';

interface AccessTokenResult {
  token_type: 'bearer';
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

type User = 0 | 1 | 2;

// DOCS: https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
const authURL = 'https://api.twitter.com/2/oauth2/token';

export const authToken = async (
  ctx: Context,
  code: string,
  code_verifier: string,
  user: User
) => {
  const { CALLBACK_URL, TWT_CLIENT_ID_0, TWT_CLIENT_ID_1 } = ctx.env;
  const redirect_uri = CALLBACK_URL;
  const client_id = user === 0 ? TWT_CLIENT_ID_0 : TWT_CLIENT_ID_1;
  const params = {
    code,
    grant_type: 'authorization_code',
    client_id,
    redirect_uri,
    code_verifier,
  };
  const body = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');

  try {
    const request = await fetch(authURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const response: AccessTokenResult = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        params,
        response
      );
      throw `[fetch]: ${request.status} - ${
        request.statusText
      }\n${JSON.stringify(request.body)}`;
    }

    return response;
  } catch (error) {
    console.log(`[authToken]:\n${error}`);
    throw `[authToken]:\n${error}`;
  }
};

export const refreshToken = async (
  ctx: Context,
  refresh_token: string,
  user: User
) => {
  const { TWT_CLIENT_ID_0, TWT_CLIENT_ID_1 } = ctx.env;
  const client_id =
    user === 'fourjuaneight' ? TWT_CLIENT_ID_0 : TWT_CLIENT_ID_1;
  const params = {
    refresh_token,
    grant_type: 'refresh_token',
    client_id,
  };
  const body = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join('&');

  try {
    const request = await fetch(authURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const response: AccessTokenResult = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        params,
        response
      );
      throw `[fetch]: ${request.status} - ${request.statusText}\n${request.body}`;
    }

    return response;
  } catch (error) {
    console.log(`[refreshToken]:\n${error}`);
    throw `[refreshToken]:\n${error}`;
  }
};
