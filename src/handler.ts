import { addState } from './hasura';

import { version } from '../package.json';

// default responses
const responseInit = {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
};
const badReqBody = {
  status: 400,
  statusText: 'Bad Request',
  ...responseInit,
};
const errReqBody = {
  status: 500,
  statusText: 'Internal Error',
  ...responseInit,
};
const noAuthReqBody = {
  status: 401,
  statusText: 'Unauthorized',
  ...responseInit,
};

export const handleCallback = async (request: Request): Promise<Response> => {
  try {
    const key = request.headers.get('key');
    const { searchParams } = new URL(request.url);

    switch (true) {
      case !searchParams.has('state'):
        return new Response(
          JSON.stringify({
            error: "Missing 'state' query parameter.",
            version,
          }),
          badReqBody
        );
      case !searchParams.has('code'):
        return new Response(
          JSON.stringify({
            error: "Missing 'code' query parameter.",
            version,
          }),
          badReqBody
        );
      case !request.headers.has('key'):
        return new Response(
          JSON.stringify({ error: "Missing 'Key' header." }),
          noAuthReqBody
        );
      case key !== AUTH_KEY:
        return new Response(
          JSON.stringify({
            error: "You're not authorized to access this API.",
            version,
          }),
          noAuthReqBody
        );
      default: {
        const state = searchParams.get('state');
        const code = searchParams.get('code');
        const newState = await addState(code, state);

        return new Response(
          JSON.stringify({ id: newState, state, code }),
          responseInit
        );
      }
    }
  } catch (error) {
    console.log({ error, version });
    return new Response(JSON.stringify({ error, version }), errReqBody);
  }
};
