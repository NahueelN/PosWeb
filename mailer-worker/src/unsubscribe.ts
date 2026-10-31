export async function createToken(secret: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyToken(secret: string, email: string, token: string): Promise<boolean> {
  if (!secret || !/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = await createToken(secret, email);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return difference === 0;
}
