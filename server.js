const express = require("express");
const app = express();

app.use(express.json());

// Allow requests from anywhere (Claude artifacts, browsers, etc.)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const DFS_BASE = "https://api.dataforseo.com/v3";
const DFS_LOGIN    = process.env.DFS_LOGIN;
const DFS_PASSWORD = process.env.DFS_PASSWORD;

if (!DFS_LOGIN || !DFS_PASSWORD) {
  console.error("❌  Missing DFS_LOGIN or DFS_PASSWORD environment variables.");
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${DFS_LOGIN}:${DFS_PASSWORD}`).toString("base64");

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "SEO Proxy is running ✅" });
});

// Forward all /api/dataforseo/* calls to DataForSEO
app.all("/api/dataforseo/*", async (req, res) => {
  const dfsPath = req.path.replace("/api/dataforseo", "");
  const url = DFS_BASE + dfsPath;

  try {
    const options = {
      method: req.method,
      headers: {
        Authorization: AUTH,
        "Content-Type": "application/json",
      },
    };

    if (req.method === "POST" && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: "Proxy request failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅  SEO Proxy running on port ${PORT}`));
