// @ts-nocheck
/* * 这是一个针对三星浏览器/旧内核的运行时补丁 (Polyfill)。
 * 它仅在浏览器不支持 Uint8Array.toBase64/fromBase64 时才会生效。
 * * 核心逻辑：
 * 1. 监测原生环境是否缺失这两个 API。
 * 2. 如果缺失，使用传统的 btoa/atob 进行降级模拟。
 * 3. 如果原生支持（如 Chrome/Edge），此代码会被跳过，零性能损耗。
 */

if (!Uint8Array.prototype.toBase64) {
  Uint8Array.prototype.toBase64 = function () {
    // 将 Uint8Array 转换为二进制字符串
    let binary = '';
    const len = this.byteLength;
    // 为避免巨型数组导致栈溢出，分块处理
    const chunkSize = 0x8000; 
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null, 
        this.subarray(i, Math.min(i + chunkSize, len))
      );
    }
    // 使用浏览器原生的 btoa 转换为 Base64
    return window.btoa(binary);
  };
}

if (!Uint8Array.fromBase64) {
  Uint8Array.fromBase64 = function (string, options) {
    // 使用浏览器原生的 atob 解码 Base64
    // 注意：此垫片忽略了 options (如 lastChunkHandling)，直接利用 atob 的宽松特性
    try {
      const binaryString = window.atob(string);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error('[Polyfill] Base64 解码失败:', e);
      throw e;
    }
  };
}