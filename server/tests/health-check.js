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
