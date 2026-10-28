import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWWWAuthenticate } from '../src/index.js';

test('scheme with no params returns the bare scheme', () => {
  assert.equal(buildWWWAuthenticate('Bearer'), 'Bearer');
});

test('scheme with a single realm param', () => {
  assert.equal(
    buildWWWAuthenticate('Basic', { realm: 'Restricted' }),
    'Basic realm="Restricted"',
  );
});

test('scheme with multiple params uses comma-space separator', () => {
  assert.equal(
    buildWWWAuthenticate('Bearer', { realm: 'API', error: 'invalid_token' }),
    'Bearer realm="API", error="invalid_token"',
  );
});

test('params are emitted in insertion order (string keys)', () => {
  const params = {};
  params.b = '2';
  params.a = '1';
  assert.equal(buildWWWAuthenticate('X', params), 'X b="2", a="1"');
});

test('double quotes inside a value are backslash-escaped', () => {
  assert.equal(
    buildWWWAuthenticate('Basic', { realm: 'say "hi"' }),
    'Basic realm="say \\"hi\\""',
  );
});

test('backslashes inside a value are escaped', () => {
  assert.equal(
    buildWWWAuthenticate('Basic', { realm: 'C:\\\\Users' }),
    'Basic realm="C:\\\\\\\\Users"',
  );
});

test('numeric values are coerced to strings and quoted', () => {
  assert.equal(
    buildWWWAuthenticate('Bearer', { max_age: 3600 }),
    'Bearer max_age="3600"',
  );
});

test('empty string value is emitted as empty quoted-string', () => {
  assert.equal(
    buildWWWAuthenticate('Bearer', { error: '' }),
    'Bearer error=""',
  );
});

test('value containing spaces and comma is preserved inside quotes', () => {
  assert.equal(
    buildWWWAuthenticate('Basic', { realm: 'a, b c' }),
    'Basic realm="a, b c"',
  );
});

test('scheme containing a space is rejected', () => {
  assert.throws(() => buildWWWAuthenticate('Not A Token', {}), TypeError);
});

test('empty string scheme is rejected', () => {
  assert.throws(() => buildWWWAuthenticate('', {}), TypeError);
});

test('parameter name that is not a token is rejected', () => {
  assert.throws(
    () => buildWWWAuthenticate('Bearer', { 'bad name': 'x' }),
    TypeError,
  );
});

test('null params produces the bare scheme', () => {
  assert.equal(buildWWWAuthenticate('Bearer', null), 'Bearer');
});

test('undefined params produces the bare scheme', () => {
  assert.equal(buildWWWAuthenticate('Bearer', undefined), 'Bearer');
});

test('array params is rejected (not a plain object)', () => {
  assert.throws(() => buildWWWAuthenticate('Bearer', ['x']), TypeError);
});

test('non-string scheme is rejected', () => {
  assert.throws(() => buildWWWAuthenticate(42, {}), TypeError);
});
