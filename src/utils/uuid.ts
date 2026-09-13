/**
 * RFC-4122 v4 UUID generator.
 *
 * Hand-rolled rather than pulled from a package: the backend validates these
 * with @IsUUID(), so the version and variant bits have to be right, but that is
 * the entire requirement — no need for a dependency. Math.random is fine here
 * because these are idempotency keys scoped to one device, not secrets.
 */
export function uuidv4(): string {
  const hex = '0123456789abcdef';
  let out = '';

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4'; // version
    } else if (i === 19) {
      out += hex[(Math.random() * 4) | 8]; // variant: 8, 9, a or b
    } else {
      out += hex[(Math.random() * 16) | 0];
    }
  }

  return out;
}
