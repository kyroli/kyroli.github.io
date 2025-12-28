/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Uint8Array {
  toBase64(options?: { alphabet?: 'base64' | 'base64url'; omitPadding?: boolean }): string;
}

interface Uint8ArrayConstructor {
  fromBase64(
    string: string,
    options?: {
      alphabet?: 'base64' | 'base64url';
      lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial';
    }
  ): Uint8Array;
}