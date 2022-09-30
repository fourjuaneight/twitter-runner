interface HasuraInsertResp {
  data: {
    [key: string]: {
      [key: string]: string;
    };
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

/**
 * Upload code and state to Hasura.
 * @function
 * @async
 *
 * @param {string} code
 * @param {string} state
 * @returns {Promise<string>}
 */
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
