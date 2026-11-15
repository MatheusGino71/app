require("./register.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assertSameOrigin } = require("../lib/server/http.ts");
test("origem usa Host real quando Next normaliza request.url e rejeita origem externa", () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request("http://localhost:3000/api/auth", { headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" } })));
  assert.throws(() => assertSameOrigin(new Request("http://localhost:3000/api/auth", { headers: { host: "127.0.0.1:3000", origin: "https://attacker.example" } })), /Origem/);
  assert.throws(() => assertSameOrigin(new Request("http://localhost:3000/api/auth", { headers: { host: "localhost:3000" } })), /Origem/);
});
