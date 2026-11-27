// Encoding PlantUML source into plantuml.com URLs.

export function toHex(text) {
  return Array.from(new TextEncoder().encode(text)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// PlantUML's server expects source compressed with raw deflate then packed 3 bytes -> 4 chars,
// like base64 but with its own alphabet (0-9, A-Z, a-z, -, _). A plain hex-encoded (~h) URL is
// roughly 2x the source size and reliably 400s on any diagram bigger than a toy example, so this
// is required for anything real — not an optimization.
export function encode6bit(value) {
  if (value < 10) return String.fromCharCode(48 + value);
  value -= 10;
  if (value < 26) return String.fromCharCode(65 + value);
  value -= 26;
  if (value < 26) return String.fromCharCode(97 + value);
  value -= 26;
  return value === 0 ? '-' : '_';
}

export function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1) + encode6bit(c2) + encode6bit(c3) + encode6bit(c4);
}

export function encode64(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    if (i + 2 < bytes.length) result += append3bytes(bytes[i], bytes[i + 1], bytes[i + 2]);
    else if (i + 1 < bytes.length) result += append3bytes(bytes[i], bytes[i + 1], 0);
    else result += append3bytes(bytes[i], 0, 0);
  }
  return result;
}

export async function encodePlantUml(text) {
  const bytes = new TextEncoder().encode(text);
  if (typeof CompressionStream === 'function') {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      return encode64(compressed);
    } catch { /* fall through to the hex scheme below */ }
  }
  return `~h${toHex(text)}`;
}

export function pumlUrls(encoded) {
  return {
    svg: `https://www.plantuml.com/plantuml/svg/${encoded}`,
    edit: `https://www.plantuml.com/plantuml/uml/${encoded}`
  };
}
