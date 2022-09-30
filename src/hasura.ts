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
    const request = await fetch(`${HASURA_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hasura-Admin-Secret': `${HASURA_ADMIN_SECRET}`,
      },
      body: JSON.stringify({ query }),
    });
    const response: HasuraInsertResp | HasuraErrors = await request.json();

    if (response.errors) {
      const { errors } = response as HasuraErrors;

      throw `(addState) - ${list}: \n ${errors
        .map(err => `${err.extensions.path}: ${err.message}`)
        .join('\n')} \n ${query}`;
    }

    return (response as HasuraInsertResp).data.insert_meta_twitter_state_one.id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
