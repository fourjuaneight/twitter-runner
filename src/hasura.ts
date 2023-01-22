import { Context } from 'hono';

interface HasuraInsertResp {
  data: {
    [key: string]: {
      [key: string]: string;
    };
  };
}

interface HasuraQueryResp {
  data: {
    [key: string]: {
      [key: string]: string;
    }[];
  };
}

interface HasuraErrors {
  errors: {
    extensions: {
      path: string;
      code: string;
    };
    message: string;
  }[];
}

export interface State {
  codeVerifier: string;
  state: string;
  user: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  user: number;
}

type Table = 'state' | 'tokens';

type Type = 'query' | 'search' | 'mutation';

const getQuery = <D extends unkown>(table: Table, type: Type, data: D) => {
  switch (true) {
    case table === 'state' && type === 'query':
      return `
        query {
          meta_twitter_state(
            where: {user: {_eq: ${data.user}}},
            order_by: {created_at: desc}
          ) {
            codeVerifier
            state
            user
          }
        }
      `;
    case table === 'state' && type === 'search':
      return `
        query {
          meta_twitter_state(
            where: {state: {_eq: "${data.state}"}},
            order_by: {created_at: desc}
          ) {
            codeVerifier
            state
            user
          }
        }
      `;
    case table === 'tokens' && type === 'query':
      return `
        query {
          meta_twitter_tokens(
            where: {user: {_eq: ${data.user}}},
            order_by: {created_at: desc}
          ) {
            accessToken
            refreshToken
            user
          }
        }
      `;
    case table === 'tokens' && type === 'search':
      return `
        query {
          meta_twitter_tokens(
            where: {accessToken: {_eq: "${data.accessToken}"}},
            order_by: {created_at: desc}
          ) {
            accessToken
            refreshToken
            user
          }
        }
      `;
    case table === 'tokens' && type === 'mutation':
      return `
        mutation {
          insert_meta_twitter_tokens_one(
            object: {
              accessToken: "${data.accessToken}",
              refreshToken: "${data.refreshToken}",
              user: ${data.user}
            }
          ) {
            id
            accessToken
            refreshToken
            user
          }
        }
      `;
    default:
      return `
        mutation {
          insert_meta_twitter_state_one(
            object: {
              codeVerifier: "${data.codeVerifier}",
              state: "${data.state}",
              user: ${data.user}
            }
          ) {
            id
            codeVerifier
            state
            user
          }
        }
      `;
  }
};

// Upload code and state to Hasura.
export const addData = async <D extends unkown>(
  ctx: Context,
  table: Table,
  type: Type,
  data: D,
): Promise<D> => {
  const query = getQuery<D>(table, type, data);

  try {
    const request = await fetch(`${ctx.env.HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${ctx.env.HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({ query }),
    });
    const response: HasuraInsertResp | HasuraErrors = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    if (response.errors) {
      const { errors } = response as HasuraErrors;
      const errLog = errors
        .map((err) => `${err.extensions.path}: ${err.message}`)
        .join('\n');

      console.log(`[hasura]:\n${errLog}`, { query });
      throw `[hasura]:\n${errLog}\n${query}`;
    }

    return (response as HasuraInsertResp).data[
      `insert_meta_twitter_${table}_one`
    ];
  } catch (error) {
    console.log(`[addData][${table}]:\n${error}`);
    throw `[addData][${table}]:\n${error}`;
  }
};

// Get code and state to Hasura.
export const getData = async <D extends unkown>(
  ctx: Context,
  table: Table,
  type: Type,
  data: D,
): Promise<D> => {
  const query = getQuery<D>(table, type, data);

  try {
    const request = await fetch(`${ctx.env.HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${ctx.env.HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({ query }),
    });
    const response: HasuraQueryResp | HasuraErrors = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    if (response.errors) {
      const { errors } = response as HasuraErrors;
      const errLog = errors
        .map((err) => `${err.extensions.path}: ${err.message}`)
        .join('\n');

      console.log(`[hasura]:\n${errLog}`, { query });
      throw `[hasura]:\n${errLog}\n${query}`;
    }

    return (response as HasuraQueryResp).data[`meta_twitter_${table}`][0];
  } catch (error) {
    console.log(`[getData][${table}]:\n${error}`);
    throw `[getData][${table}]:\n${error}`;
  }
};

// Upload prompts to Hasura.
export const addPrompt = async (
  ctx: Context,
  table: string,
  prompt: string,
): Promise<string> => {
  const query = `
    mutation addPrompt($prompt: String!) {
      insert_models_${table}_one(object: {prompt: $prompt}) {
        id
      }
    }
  `;

  try {
    const request = await fetch(`${ctx.env.HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${ctx.env.HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          prompt,
        },
      }),
    });
    const response: HasuraInsertResp | HasuraErrors = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    if (response.errors) {
      const { errors } = response as HasuraErrors;
      const errLog = errors
        .map((err) => `${err.extensions.path}: ${err.message}`)
        .join('\n');

      console.log(`[hasura]:\n${errLog}`, { query });
      throw `[hasura]:\n${errLog}\n${query}`;
    }

    return (response as HasuraInsertResp).data[`insert_models_${table}_one`].id;
  } catch (error) {
    console.log(`[addPrompt][${table}]:\n${error}`);
    throw `[addPrompt][${table}]:\n${error}`;
  }
};

// Get prompts Hasura.
export const getPrompts = async (
  ctx: Context,
  table: string,
): Promise<string[]> => {
  const query = `
    {
      models_${table} {
        prompt
      }
    }
  `;

  try {
    const request = await fetch(`${ctx.env.HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${ctx.env.HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({
        query,
      }),
    });
    const response: HasuraQueryResp | HasuraErrors = await request.json();

    if (request.status !== 200) {
      console.log(
        `[fetch]: ${request.status} - ${request.statusText}`,
        response,
      );
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    if (response.errors) {
      const { errors } = response as HasuraErrors;
      const errLog = errors
        .map((err) => `${err.extensions.path}: ${err.message}`)
        .join('\n');

      console.log(`[hasura]:\n${errLog}`, { query });
      throw `[hasura]:\n${errLog}\n${query}`;
    }
    const list = (response as HasuraQueryResp).data[`models_${table}`].map(
      (row) => row.prompt,
    );

    return list;
  } catch (error) {
    console.log(`[addPrompt][${table}]:\n${error}`);
    throw `[addPrompt][${table}]:\n${error}`;
  }
};
