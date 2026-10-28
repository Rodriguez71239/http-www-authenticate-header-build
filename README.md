# http-www-authenticate-header-build

Constructs a `WWW-Authenticate` header value from an authentication scheme name and an optional object of challenge parameters.

```js
import { buildWWWAuthenticate } from 'http-www-authenticate-header-build';

buildWWWAuthenticate('Basic', { realm: 'Restricted' });
// -> 'Basic realm="Restricted"'

buildWWWAuthenticate('Bearer', {
  realm: 'API',
  error: 'invalid_token',
  error_description: 'The token has expired',
});
// -> 'Bearer realm="API", error="invalid_token", error_description="The token has expired"'

buildWWWAuthenticate('Bearer');
// -> 'Bearer'
```

## Why

Servers emitting `401 Unauthorized` need to produce a syntactically correct `WWW-Authenticate` header by hand. The header format (RFC 7235) is simple but fiddly: scheme, then comma-separated `name=value` pairs, with values that may contain spaces or quotes requiring escaping. This library does exactly that and nothing else — no parsing, no challenge chaining, no auth-logic.

## Design decisions

- **Always quotes values.** Every parameter value is emitted as a quoted-string, even when the value is a bare token like `invalid_token`. This is strictly legal per the ABNF (`auth-param = token BWS "=" ( token / quoted-string )`) and removes the need to classify each value. The trade-off is a slightly longer header; correctness and simplicity win.
- **Parameter order is insertion order.** JavaScript object string-key iteration is insertion-ordered, so params appear in the order you add them. Numeric keys are not reordered.

## Edge cases you will hit

- **Invalid scheme or parameter name.** `buildWWWAuthenticate` throws `TypeError` if the scheme or any parameter key is not a valid RFC 7235 token (e.g. contains spaces). Validate input before calling if you prefer to fail soft.
- **Escaping.** Double quotes (`"`) and backslashes (`\\`) inside values are backslash-escaped. No other characters are escaped; control characters are passed through verbatim — sanitize upstream if that matters for your deployment.
- **Null/undefined params.** Produces the bare scheme with no trailing space or comma.
