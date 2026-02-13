export async function gitHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  const header = `blob ${data.length}\0`;
  const headerData = encoder.encode(header);
  
  const fullData = new Uint8Array(headerData.length + data.length);
  fullData.set(headerData);
  fullData.set(data, headerData.length);
  
  const hashBuffer = await crypto.subtle.digest('SHA-1', fullData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}