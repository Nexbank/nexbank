const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

const startedAt = Date.now();
const httpRequests = new Map();
const httpLatency = new Map();
const transactionEvents = new Map();

const normalizeRoute = (req) => {
  if (req.route?.path) {
    const base = req.baseUrl || "";
    const routePath = Array.isArray(req.route.path) ? req.route.path[0] : req.route.path;
    return `${base}${routePath}` || "/";
  }

  return req.path || req.originalUrl?.split("?")[0] || "unknown";
};

const labelsKey = (labels) => JSON.stringify(labels);
const parseKey = (key) => JSON.parse(key);

const incrementMap = (map, labels, amount = 1) => {
  const key = labelsKey(labels);
  map.set(key, (map.get(key) || 0) + amount);
};

const observeLatency = (labels, value) => {
  const key = labelsKey(labels);
  const entry =
    httpLatency.get(key) ||
    {
      count: 0,
      sum: 0,
      buckets: Object.fromEntries(buckets.map((bucket) => [bucket, 0])),
    };

  entry.count += 1;
  entry.sum += value;
  buckets.forEach((bucket) => {
    if (value <= bucket) {
      entry.buckets[bucket] += 1;
    }
  });

  httpLatency.set(key, entry);
};

const formatLabelValue = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");

const formatLabels = (labels) => {
  const entries = Object.entries(labels);
  if (entries.length === 0) {
    return "";
  }

  return `{${entries.map(([key, value]) => `${key}="${formatLabelValue(value)}"`).join(",")}}`;
};

const metricLine = (name, labels, value) => `${name}${formatLabels(labels)} ${value}`;

const metricsMiddleware = (req, res, next) => {
  if (req.path === "/metrics") {
    next();
    return;
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const labels = {
      method: req.method,
      route: normalizeRoute(req),
      status_code: res.statusCode,
    };

    incrementMap(httpRequests, labels);
    observeLatency(labels, durationSeconds);
  });

  next();
};

const recordTransaction = ({ type = "unknown", status = "unknown", route = "standard" } = {}) => {
  incrementMap(transactionEvents, { type, status, route });
};

const renderMetrics = () => {
  const lines = [
    "# HELP nexbank_api_uptime_seconds API process uptime in seconds.",
    "# TYPE nexbank_api_uptime_seconds gauge",
    metricLine("nexbank_api_uptime_seconds", {}, Math.floor((Date.now() - startedAt) / 1000)),
    "# HELP nexbank_http_requests_total Total HTTP requests handled by the API.",
    "# TYPE nexbank_http_requests_total counter",
  ];

  httpRequests.forEach((value, key) => {
    lines.push(metricLine("nexbank_http_requests_total", parseKey(key), value));
  });

  lines.push(
    "# HELP nexbank_http_request_duration_seconds HTTP request latency in seconds.",
    "# TYPE nexbank_http_request_duration_seconds histogram"
  );

  httpLatency.forEach((entry, key) => {
    const labels = parseKey(key);
    buckets.forEach((bucket) => {
      lines.push(
        metricLine(
          "nexbank_http_request_duration_seconds_bucket",
          { ...labels, le: bucket },
          entry.buckets[bucket]
        )
      );
    });
    lines.push(
      metricLine("nexbank_http_request_duration_seconds_bucket", { ...labels, le: "+Inf" }, entry.count),
      metricLine("nexbank_http_request_duration_seconds_sum", labels, entry.sum),
      metricLine("nexbank_http_request_duration_seconds_count", labels, entry.count)
    );
  });

  lines.push(
    "# HELP nexbank_transactions_total Total transaction events created by the banking API.",
    "# TYPE nexbank_transactions_total counter"
  );

  transactionEvents.forEach((value, key) => {
    lines.push(metricLine("nexbank_transactions_total", parseKey(key), value));
  });

  return `${lines.join("\n")}\n`;
};

module.exports = {
  metricsMiddleware,
  recordTransaction,
  renderMetrics,
};
