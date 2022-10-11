import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import fetch from 'isomorphic-fetch';

interface PromptsResponse {
  prompts: string[];
  version: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  version: string;
}

interface TweetResponse {
  success: string;
  accessToken: string;
  id: string;
}

dotenv.config();

const { ACCESS_KEY, ACTIVE_USER, AUTH_KEY, OPENAI_API_KEY, WORKER_ENDPOINT } =
  process.env;
const configuration = new Configuration({
  apiKey: `${OPENAI_API_KEY}`,
});
const openai = new OpenAIApi(configuration);

const getPrompts = async () => {
  try {
    const request = await fetch(
      `${WORKER_ENDPOINT}/prompts?key=${ACCESS_KEY}&table=webdev`,
    );
    const response: PromptsResponse = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw new Error(`[fetch]: ${request.status} - ${request.statusText}`);
    }

    return response.prompts;
  } catch (error) {
    throw new Error(`[prompts] - ${error}`);
  }
};
const getToken = async () => {
  try {
    const request = await fetch(
      `${WORKER_ENDPOINT}/access?key=${ACCESS_KEY}&user=${ACTIVE_USER}`,
    );
    const response: TokenResponse = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw new Error(`[fetch]: ${request.status} - ${request.statusText}`);
    }

    return response.accessToken;
  } catch (error) {
    throw new Error(`[prompts] - ${error}`);
  }
};
const tweet = async (token: string, body: string) => {
  try {
    const request = await fetch(`${WORKER_ENDPOINT}/tweet`, {
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: `${AUTH_KEY}`,
        token,
        user: `${ACTIVE_USER}`,
        body,
      }),
    });
    const response: TweetResponse = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw new Error(`[fetch]: ${request.status} - ${request.statusText}`);
    }

    return response.success;
  } catch (error) {
    throw new Error(`[tweet] - ${error}`);
  }
};

(async () => {
  try {
    const prompts = await getPrompts();
    const completion = await openai.createCompletion({
      model: 'text-davinci-002',
      prompt: `${prompts.map(
        (item) => `${item}\n`,
      )}\ntweet something cool for web development twitter`,
      max_tokens: 64,
    });
    const text = completion.data.choices[0].text;
    const token = await getToken();

    await tweet(token, text);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
