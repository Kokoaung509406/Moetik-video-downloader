const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "MR. MOE DEE DOWNLOADER" }));

// This starter intentionally does not scrape TikTok/YouTube or remove watermarks.
// Add provider integrations only through their official APIs and within their terms.
app.post("/api/inspect", (req, res) => {
  const url = String(req.body?.url || "").trim();
  if (!url) return res.status(400).json({ error: "Please paste a video URL." });
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: "That URL is not valid." }); }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only HTTP or HTTPS links are accepted." });
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" ||
      host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    return res.json({
      status: "provider_link",
      message: "This is a platform link. Use the platform's official download/export options where available, or connect an approved API for content you own or are authorized to use. This starter does not bypass platform restrictions or remove watermarks."
    });
  }
  res.json({
    status: "direct_link",
    message: "Link received. Before enabling downloads, verify that you own this media or have permission to download and redistribute it.",
    url: parsed.toString()
  });
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`MR. MOE DEE DOWNLOADER running on ${PORT}`));
