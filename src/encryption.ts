export const createHash = async (str: string) => {
  try {
    const blob = new Blob([str], { type: 'text/plain; charset=utf-8' });
    const data = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;
  } catch (error) {
    throw `(createHash):\n${error}`;
  }
};

export const escapeBase64Url = (string: string) =>
  string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export const generateRandomString = (length: number) => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

  for (let i = 0; i < length; i += 1) {
    text += possible[Math.floor(Math.random() * possible.length)];
  }

  return text;
};
