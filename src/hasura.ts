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
  code: string;
  state: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

type Table = 'state' | 'tokens';

type Type = 'query' | 'mutation';

const getQuery = <D extends unkown>(table: Table, type: Type, data: D) => {
  switch (true) {
    case table === 'state' && type === 'query':
      return `
        query {
          meta_twitter_state(where: {state: {_eq: "${data.state}"}}) {
            code
            state
          }
        }
      `;
    case table === 'tokens' && type === 'query':
      return `
        query {
          meta_twitter_tokens(where: {refreshToken: {_eq: "${data.refreshToken}"}}) {
            accessToken
            refreshToken
          }
        }
      `;
    case table === 'tokens' && type === 'mutation':
      return `
        mutation {
          insert_meta_twitter_tokens_one(
            object: {
              accessToken: "${data.accessToken}",
              refreshToken: "${data.refreshToken}"
            }
          ) {
            id
            accessToken
            refreshToken
          }
        }
      `;
    default:
      return `
        mutation {
          insert_meta_twitter_state_one(
            object: {
              codeVerifier: "${data.code}",
              state: "${data.state}"
            }
          ) {
            id
            codeVerifier
            state
          }
        }
      `;
  }
};

// Upload code and state to Hasura.
export const addData = async <D extends unkown>(
  env: { [key: string]: any },
  table: Table,
  type: Type,
  data: D
): Promise<D> => {
  const query = getQuery<D>(table, type, data);

  try {
    const request = await fetch(`${env.HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${env.HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({ query }),
    });

    if (request.status !== 200) {
      console.log(`[fetch]: ${request.status} - ${request.statusText}`);
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    const response: HasuraInsertResp | HasuraErrors = await request.json();

    if (response.errors) {
      const { errors } = response as HasuraErrors;
      const errLog = errors
        .map(err => `${err.extensions.path}: ${err.message}`)
        .join('\n');

      console.log(`[hasura]:\n${errLog}`);
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
  env: { [key: string]: any },
  table: Table,
  type: Type,
  data: D
): Promise<D> => {
  const query = getQuery<D>(table, type, data);

  try {
    const request = await fetch(`${env.HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${env.HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({ query }),
    });

    if (request.status !== 200) {
      console.log(`[fetch]: ${request.status} - ${request.statusText}`);
      throw `[fetch]: ${request.status} - ${request.statusText}`;
    }

    const response: HasuraQueryResp | HasuraErrors = await request.json();

    if (response.errors) {
      const { errors } = response as HasuraErrors;
      const errLog = errors
        .map(err => `${err.extensions.path}: ${err.message}`)
        .join('\n');

      console.log(`[hasura]:\n${errLog}`);
      throw `[hasura]:\n${errLog}\n${query}`;
    }

    return (response as HasuraQueryResp).data[`meta_twitter_${table}`][0];
  } catch (error) {
    console.log(`[getData][${table}]:\n${error}`);
    throw `[getData][${table}]:\n${error}`;
  }
};
