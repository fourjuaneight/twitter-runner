/* eslint-disable camelcase */
import { Context } from 'hono';

interface AccessTokenResult {
  token_type: 'bearer';
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

export const authToken = async (
  ctx: Context,
  code: string,
  code_verifier: string
) => {
  const { CALLBACK_URL, TWEET_CLIENT_ID, TWEET_CLIENT_SECRET } = ctx.env;
  const redirect_uri = CALLBACK_URL;
  const client_id = TWEET_CLIENT_ID;
  const client_secret = TWEET_CLIENT_SECRET;

  try {
    const request = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        redirect_uri,
        code_verifier,
      }),
    });

    if (request.status !== 200) {
      console.log(`[fetch]: ${request.status} - ${request.statusText}`);
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    const response: AccessTokenResult = await request.json();

    return response;
  } catch (error) {
    console.log(`[authToken]:\n${error}`);
    throw `[authToken]:\n${error}`;
  }
};
