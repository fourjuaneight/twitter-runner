export const createHash = async (str: string) => {
  try {
    const encoder = new TextEncoder().encode(str);
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashString = String.fromCharCode(...new Uint8Array(hashBuffer));
    const base64 = btoa(hashString);

    return base64;
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
