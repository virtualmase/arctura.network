const express = require("express");
const path = require("path");

const app = express();
const root = __dirname;
const canonicalHost = "arctura.network";

app.disable("x-powered-by");
app.use((request, response, next) => {
  const forwardedHost = request.headers["x-forwarded-host"]?.split(",")[0]?.trim();
  const host = (forwardedHost || request.headers.host)?.split(":")[0]?.toLowerCase();
  if (host === `www.${canonicalHost}`) {
    return response.redirect(308, `https://${canonicalHost}${request.originalUrl || request.url}`);
  }
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
  if (request.secure || request.headers["x-forwarded-proto"] === "https") {
    response.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});

app.get("/health", (_request, response) => {
  response.json({ service: "arctura-network", status: "ok", version: "1.1.0" });
});

app.get("/ready", (_request, response) => {
  response.json({ service: "arctura-network", ready: true, dependencies: "static" });
});

app.get("/.well-known/agent.json", (_request, response) => {
  response.sendFile(path.join(root, ".well-known", "agent.json"));
});

app.use(express.static(root, { extensions: ["html"], index: "index.html" }));

app.get("/faq", (_request, response) => {
  response.sendFile(path.join(root, "faq", "index.html"));
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "not_found" });
});

app.use((_request, response) => {
  response.status(404).sendFile(path.join(root, "404.html"));
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Arctura server running on port ${port}`));
}

module.exports = app;
