# Owner actions

Things only the repository owner can decide. Last updated 2026-11-23.

**Nothing is blocking.** The live app (`master` on Render) needs no action.

## Optional decisions

1. **Keep or retire the `main` branch.** It is the May 2026 Next.js rewrite
   that became [museums-eu-atlas](https://github.com/aydar-ga/museums-eu-atlas).
   It is not deployed. On 2026-11-23 its CI was fixed (`b6dfa31`) and its
   magic-link login leak was closed (`bef40a2`). Deleting it is your call;
   maintenance agents do not delete branches.
2. **Port the magic-link fix to museums-eu-atlas** if it is not there yet.
   `bef40a2` on `main` is a tested reference: links are returned only with
   `AUTH_DEV_MAGIC_LINK=1`, the API answers 503 when email is not configured,
   and tokens need `AUTH_SECRET`.
3. **Node 25+ and `main`'s unit tests.** Under Node 26, 5 Vitest tests on
   `main` fail because Node's built-in `localStorage` hides jsdom's. CI pins
   Node 24, where all tests pass. This matters only if `main` is revived.
