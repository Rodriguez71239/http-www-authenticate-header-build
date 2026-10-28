/**
 * Character classifications used for token and quoted-string parsing.
 *
 * RFC 7235 §2.1 defines `token` as: one or more characters that are not
 * separators or CTL.  A bareword parameter name MUST be a token, so callers
 * passing a non-token name get a TypeError rather than a malformed header.
 */
const TOKEN_CHARS = new Set([
  '!', '#', '$', '%', '&', '\'', '*', '+', '-', '.', '^', '_', '`', '|', '~',
]);
for (let i = 48; i <= 57; i++) TOKEN_CHARS.add(String.fromCharCode(i)); // 0-9
for (let i = 65; i <= 90; i++) TOKEN_CHARS.add(String.fromCharCode(i)); // A-Z
for (let i = 97; i <= 122; i++) TOKEN_CHARS.add(String.fromCharCode(i)); // a-z

/**
 * Returns true when `s` is a valid RFC 7235 token: one or more token-chars.
 */
function isToken(s) {
  if (typeof s !== 'string' || s.length === 0) return false;
  for (const ch of s) if (!TOKEN_CHARS.has(ch)) return false;
  return true;
}

/**
 * Quotes a single parameter value per RFC 7235 §2.1 quoted-string rules.
 *
 * A quoted-string MUST escape backslash ("\\") and the double-quote ('"')
 * with a backslash.  We use quoted-string form for every value because the
 * most common auth params (realm, error, error_description) routinely
 * contain spaces and punctuation, so quoting-by-default is safer than
 * guessing which values are tokens.
 */
function quoteValue(value) {
  const s = typeof value === 'string' ? value : String(value);
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' || ch === '"') out += '\\';
    out += ch;
  }
  out += '"';
  return out;
}

/**
 * Builds a `WWW-Authenticate` header value from `scheme` and `params`.
 *
 * Layout: `scheme [param1=val1, param2=val2, ...]`.
 *  - `scheme` must be a non-empty token.
 *  - `params` may be null/undefined (no challenge params) or an object
 *    whose keys are tokens.  Values are coerced to strings and always
 *    emitted as quoted-strings (see quoteValue for why).
 *
 * Returns a string ready to use as an HTTP header value.
 */
export function buildWWWAuthenticate(scheme, params) {
  if (!isToken(scheme)) {
    throw new TypeError(`scheme must be a non-empty RFC 7235 token; got ${String(scheme)}`);
  }

  let out = scheme;

  if (params != null) {
    if (typeof params !== 'object' || Array.isArray(params)) {
      throw new TypeError('params must be a plain object or null/undefined');
    }
    const keys = Object.keys(params);
    for (let i = 0; i < keys.length; i++) {
      const name = keys[i];
      if (!isToken(name)) {
        throw new TypeError(`parameter name must be a token: ${JSON.stringify(name)}`);
      }
      const value = params[name];
      out += i === 0 ? ' ' : ', ';
      out += name;
      out += '=';
      out += quoteValue(value);
    }
  }

  return out;
}
