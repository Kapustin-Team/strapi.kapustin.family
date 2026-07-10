import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import controller from '../src/api/wedding-guest/controllers/wedding-guest.ts';
import router from '../src/api/wedding-guest/routes/wedding-guest.ts';
import apiTokenOnly from '../src/policies/api-token-only.ts';

const originalStrapi = globalThis.strapi;

afterEach(() => {
  globalThis.strapi = originalStrapi;
});

function createContext(slug: unknown) {
  const result: { status?: number; body?: unknown } = {};
  return {
    request: { body: { slug } },
    notFound() {
      result.status = 404;
      result.body = { error: 'Not Found' };
      return result.body;
    },
    send(body: unknown) {
      result.status = 200;
      result.body = body;
      return body;
    },
    result,
  };
}

test('exposes one API-token-only lookup route and no collection route', () => {
  assert.deepEqual(router, {
    type: 'content-api',
    routes: [
      {
        method: 'POST',
        path: '/wedding-guests/lookup',
        handler: 'wedding-guest.lookup',
        config: {
          auth: {
            scope: ['api::wedding-guest.wedding-guest.find'],
          },
          policies: ['global::api-token-only'],
        },
      },
    ],
  });
});

test('rejects Public role even if it is accidentally granted route permission', () => {
  assert.equal(apiTokenOnly({ state: { auth: { strategy: { name: 'api-token' } } } }), true);
  assert.equal(apiTokenOnly({ state: { auth: { strategy: { name: 'users-permissions' } } } }), false);
  assert.equal(apiTokenOnly({ state: {} }), false);
});

test('returns only a published exact-slug guest', async () => {
  let query: unknown;
  globalThis.strapi = {
    documents(uid: string) {
      assert.equal(uid, 'api::wedding-guest.wedding-guest');
      return {
        async findFirst(params: unknown) {
          query = params;
          return {
            slug: 'sasha',
            name: 'Саша',
            address: 'ty',
            note: 'Личная приписка',
            documentId: 'internal-id',
            createdAt: '2026-07-10T00:00:00.000Z',
          };
        },
      };
    },
  } as typeof globalThis.strapi;

  const ctx = createContext('sasha');
  await controller.lookup(ctx);

  assert.deepEqual(query, {
    filters: { slug: 'sasha' },
    status: 'published',
    fields: ['slug', 'name', 'address', 'note'],
  });
  assert.equal(ctx.result.status, 200);
  assert.deepEqual(ctx.result.body, {
    data: { slug: 'sasha', name: 'Саша', address: 'ty', note: 'Личная приписка' },
  });
});

test('unknown, revoked, invalid, and storage errors share generic 404 payload', async () => {
  const scenarios = [
    { slug: 'unknown', result: null },
    { slug: 'revoked', result: null },
    { slug: '../invalid', result: { name: 'must not leak' } },
    { slug: 'strapi-down', error: new Error('database response with personal data') },
  ];

  for (const scenario of scenarios) {
    globalThis.strapi = {
      documents() {
        return {
          async findFirst() {
            if (scenario.error) throw scenario.error;
            return scenario.result;
          },
        };
      },
    } as typeof globalThis.strapi;

    const ctx = createContext(scenario.slug);
    await controller.lookup(ctx);
    assert.equal(ctx.result.status, 404);
    assert.deepEqual(ctx.result.body, { error: 'Not Found' });
    assert(!JSON.stringify(ctx.result.body).includes(scenario.slug));
    assert(!JSON.stringify(ctx.result.body).includes('personal data'));
    assert(!JSON.stringify(ctx.result.body).includes('must not leak'));
  }
});
