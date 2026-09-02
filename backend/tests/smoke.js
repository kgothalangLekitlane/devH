const assert = require("assert");
const http = require("http");

const port = Number(process.env.SMOKE_PORT || 5000);
const request = (path) => new Promise((resolve, reject) => {
  const req = http.get({ hostname: "127.0.0.1", port, path }, (res) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on("error", reject);
  req.setTimeout(5000, () => req.destroy(new Error("request timeout")));
});

(async () => {
  const health = await request("/health");
  assert.strictEqual(health.status, 200);
  assert.strictEqual(JSON.parse(health.body).status, "ok");

  const root = await request("/");
  assert.strictEqual(root.status, 200);
  assert.strictEqual(JSON.parse(root.body).service, "devheaven-api");

  assert.strictEqual(health.headers["x-content-type-options"], "nosniff");
  assert.strictEqual(health.headers["x-frame-options"], "DENY");

  console.log("DevHeaven API smoke test passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
