import { addState } from './hasura';

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
      const { searchParams } = new URL(request.url);

      switch (true) {
        case searchParams.has('state'):
          return new Response(
            JSON.stringify({
              error: "Missing 'state' query parameter.",
            }),
            badReqBody
          );
        case searchParams.has('code'):
          return new Response(
            JSON.stringify({
              error: "Missing 'code' query parameter.",
            }),
            badReqBody
          );
        case key !== AUTH_KEY:
          return new Response(
            JSON.stringify({
              error: "You're not authorized to access this API.",
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
            JSON.stringify({ error: "Missing 'Key' header." }),
            noAuthReqBody
          );
        case key !== AUTH_KEY:
          return new Response(
            JSON.stringify({
              error: "You're not authorized to access this API.",
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
    console.log(error);
    return new Response(JSON.stringify({ error }), errReqBody);
  }
};
