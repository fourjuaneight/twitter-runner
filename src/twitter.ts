/* eslint-disable camelcase */
import { Context } from "hono";

interface AccessTokenResult {
  token_type: "bearer";
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

interface OAuthAccessResult {
  oauth_token: string;
  oauth_verifier?: string;
  oauth_token_secret: string;
}

interface TweetPosted {
  data: {
    id: string;
    text: string;
  };
}

interface TwitterResponse {
  data: {
    author_id: string;
    created_at: string;
    text: string;
    id: string;
  };
  includes: {
    users: {
      verified: boolean;
      username: string;
      id: string;
      name: string;
    }[];
  };
}

interface TwitterData {
  tweet: string;
  user: string;
  url: string;
}

type User = 0 | 1 | 2;

const BASE = "https://api.twitter.com";
const URL = `${BASE}/2`;
// DOCS: https://developer.twitter.com/en/docs/authentication/api-reference/access_token
const ACCESS = `${BASE}/oauth/access_token`;
// DOCS: https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
const AUTH = `${URL}/oauth2`;
// DOCS: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
const TWEET = `${URL}/tweets`;

export const accessOAuth = async (
  ctx: Context,
  oauth_token: string,
  oauth_verifier: string
) => {
  const { TWT_CONSUMER_KEY } = ctx.env;
  const data = {
    oauth_consumer_key: TWT_CONSUMER_KEY,
    oauth_token,
    oauth_verifier,
  };
  const params = new URLSearchParams(data);

  try {
    const request = await fetch(`${ACCESS}?${params}`, { method: "POST" });
    const response: OAuthAccessResult = await request.text();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        data,
        response
      );
      throw `[fetch]: ${request.status} - ${request.statusText} - ${response.error_description}`;
    }

    const result: OAuthAccessResult = {
      ...response,
      oauth_verifier,
    };

    return result;
  } catch (error) {
    console.log(`[accessOAuth]:\n${error}`);
    throw `[accessOAuth]:\n${error}`;
  }
};

export const authToken = async (
  ctx: Context,
  code: string,
  code_verifier: string,
  user: User
) => {
  const { CALLBACK_URL, TWT_CLIENT_ID_0, TWT_CLIENT_ID_1 } = ctx.env;
  const redirect_uri = CALLBACK_URL;
  const client_id = user === "0" ? TWT_CLIENT_ID_0 : TWT_CLIENT_ID_1;
  const params = {
    code,
    grant_type: "authorization_code",
    client_id,
    redirect_uri,
    code_verifier,
  };
  const body = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");

  try {
    const request = await fetch(`${AUTH}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
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
      throw `[fetch]: ${request.status} - ${request.statusText} - ${response.error_description}`;
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
  const client_id = user === "0" ? TWT_CLIENT_ID_0 : TWT_CLIENT_ID_1;
  const params = {
    refresh_token,
    grant_type: "refresh_token",
    client_id,
  };
  const body = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");

  try {
    const request = await fetch(`${AUTH}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
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
      throw `[fetch]: ${request.status} - ${request.statusText} - ${response.error_description}`;
    }

    return response;
  } catch (error) {
    console.log(`[refreshToken]:\n${error}`);
    throw `[refreshToken]:\n${error}`;
  }
};

export const revokeToken = async (ctx: Context, token: string, user: User) => {
  const { TWT_CLIENT_ID_0, TWT_CLIENT_ID_1 } = ctx.env;
  const client_id = user === "0" ? TWT_CLIENT_ID_0 : TWT_CLIENT_ID_1;
  const params = {
    token,
    client_id,
  };
  const body = Object.entries(params)
    .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
    .join("&");

  try {
    const request = await fetch(`${AUTH}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const response = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        params,
        response
      );
      throw `[fetch]: ${request.status} - ${request.statusText} - ${response.error_description}`;
    }

    return;
  } catch (error) {
    console.log(`[revokeToken]:\n${error}`);
    throw `[revokeToken]:\n${error}`;
  }
};

export const tweet = async (token: string, text: string) => {
  try {
    const request = await fetch(TWEET, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${token}`,
        "Content-Type": "application/json",
      },
      body: {
        text,
      },
    });
    const response: TweetPosted = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        params,
        response
      );
      throw `[fetch]: ${request.status} - ${request.statusText} - ${response.error_description}`;
    }

    return response.data.id;
  } catch (error) {
    console.log(`[tweet]:\n${error}`);
    throw `[tweet]:\n${error}`;
  }
};

export const details = async (
  ctx: Context,
  id: string
): Promise<TwitterData> => {
  const { TWT_TOKEN } = ctx.env;
  try {
    const request = await fetch(
      `https://api.twitter.com/2/tweets/${id}?tweet.fields=created_at&user.fields=username&expansions=author_id`,
      {
        headers: {
          Authorization: `Bearer ${TWT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    const response: TwitterResponse = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    const { username } = response.includes.users[0];
    const text = response.data.text
      .replace(/[‘’]+/g, `'`)
      .replace(/[“”]+/g, `'`)
      .replace(/(https:\/\/t.co\/[a-zA-z0-9]+)/g, "");

    return {
      tweet: text,
      user: `@${username}`,
      url: `https://twitter.com/${username}/status/${response.data.id}`,
    };
  } catch (error) {
    console.log(`[details] - ${error}`);
    throw `[details] - ${error}`;
  }
};
