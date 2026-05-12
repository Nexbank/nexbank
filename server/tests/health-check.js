const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.SKIP_DB = "true";

const { startServer } = require("../server");

const run = async () => {
  const server = await startServer({ port: 0 });
  const address = server.address();

  try {
    for (const path of ["/healthz", "/api/healthz"]) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.status, "ok");
      assert.equal(body.service, "nexbank-api");
    }

    const metricsResponse = await fetch(`http://127.0.0.1:${address.port}/metrics`);
    const metricsBody = await metricsResponse.text();

    assert.equal(metricsResponse.status, 200);
    assert.match(metricsResponse.headers.get("content-type"), /text\/plain/);
    assert.match(metricsBody, /nexbank_api_uptime_seconds/);
    assert.match(metricsBody, /nexbank_http_requests_total/);

    console.log("Backend health check passed");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
