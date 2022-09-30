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

/**
 * Handler method for all requests.
 * @function
 * @async
 *
 * @param {Request} request request object
 * @returns {Promise<Response>} response object
 */
export const handleRequest = async (request: Request): Promise<Response> => {
  // content-type check (required)
  if (!request.headers.has('content-type')) {
    return new Response(
      JSON.stringify({ error: "Please provide 'content-type' header." }),
      badReqBody
    );
  }

  // is content-type valid
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response(null, {
      status: 415,
      statusText:
        'Unsupported Media Type. Content-Type must be application/json.',
    });
  }

  // handle request types
  try {
    if (request.method === 'GET') {
      const key = request.headers.get('key');
      const url = new URL(request.url);
      const params = request.url.replace(
        /https:\/\/twitter-auth\.[a-z]+\.[a-z]+\/\?(.*)/g,
        '$1'
      );
      const searchParams = new URLSearchParams(params);

      switch (true) {
        case searchParams.has('state'):
          console.log({
            searchParams,
            url,
            error: "Missing 'state' query parameter.",
            version,
          });
          return new Response(
            JSON.stringify({
              error: "Missing 'state' query parameter.",
              version,
            }),
            badReqBody
          );
        case searchParams.has('code'):
          console.log({
            searchParams,
            url,
            error: "Missing 'code' query parameter.",
            version,
          });
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
          const [state, code] = searchParams.getAll('state', 'code');
          const newState = await addState(code, state);

          return new Response(
            JSON.stringify({ id: newState, state, code }),
            responseInit
          );
        }
      }
    } else if (request.method === 'POST') {
      const key = request.headers.get('key');

      switch (true) {
        case !request.headers.has('key'):
          return new Response(
            JSON.stringify({ error: "Missing 'Key' header.", version }),
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
          return new Response(JSON.stringify({ data: {} }), responseInit);
        }
      }
    } else {
      return new Response(null, {
        status: 405,
        statusText: 'Method Not Allowed',
      });
    }
  } catch (error) {
    console.log({ error, version });
    return new Response(JSON.stringify({ error, version }), errReqBody);
  }
};
