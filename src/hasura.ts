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

// Upload code and state to Hasura.
export const addState = async (
  env: { [key: string]: any },
  code: string,
  state: string
): Promise<string> => {
  const query = `
    mutation {
      insert_meta_twitter_state_one(
        object: {
          codeVerifier: "${code}",
          state: "${state}"
        }
      ) {
        id
        codeVerifier
        state
      }
    }
  `;

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

    return (response as HasuraInsertResp).data.insert_meta_twitter_state_one.id;
  } catch (error) {
    console.log(`[addState]:\n${error}`);
    throw `[addState]:\n${error}`;
  }
};

// Get code and state to Hasura.
export const getState = async (
  env: { [key: string]: any },
  state: string
): Promise<string> => {
  const query = `
    query {
      meta_twitter_state(where: {state: {_eq: "${state}"}}) {
        state
      }
    }
  `;

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

    return (response as HasuraQueryResp).data.meta_twitter_state[0].state;
  } catch (error) {
    console.log(`[getState]:\n${error}`);
    throw `[getState]:\n${error}`;
  }
};
