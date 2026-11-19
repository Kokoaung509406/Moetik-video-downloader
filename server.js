const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: true, name: "MR. MOE DEE DOWNLOAD ENGINE" });
});

app.post("/api/inspect", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    const mode = String(req.body?.mode || "hd").trim().toLowerCase();

    if (!url) {
      return res.status(400).json({ error: "ကျေးဇူးပြု၍ ဗီဒီယိုလင့်ခ် (URL) ထည့်သွင်းပါ။" });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "လင့်ခ်ပုံစံ မမှန်ကန်ပါ။" });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "HTTP သို့မဟုတ် HTTPS လင့်ခ်များကိုသာ လက်ခံပါသည်။" });
    }

    const host = parsed.hostname.toLowerCase();

    // TikTok Direct Download Engine (No Watermark)
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const json = await apiRes.json();

      if (json && json.code === 0 && json.data) {
        let downloadUrl = json.data.play; // HD No Watermark
        let ext = "mp4";

        if (mode === "audio") {
          downloadUrl = json.data.music || json.data.play;
          ext = "mp3";
        } else if (mode === "sd") {
          downloadUrl = json.data.wmplay || json.data.play;
          ext = "mp4";
        }

        return res.json({
          status: "ready",
          title: json.data.title || "TikTok Download",
          url: downloadUrl,
          ext
        });
      }

      return res.status(502).json({ error: "TikTok လင့်ခ်ကို ဖတ်၍မရပါ။" });
    }

    // YouTube Direct Download Engine
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
      const isAudio = mode === "audio";
      const cobaltRes = await fetch("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          downloadMode: isAudio ? "audio" : "video",
          audioFormat: "mp3",
          videoQuality: mode === "sd" ? "480" : "720"
        })
      });

      const cobaltData = await cobaltRes.json().catch(() => null);
      const directUrl =
        cobaltData?.url ||
        (Array.isArray(cobaltData?.picker) && cobaltData.picker[0]?.url) ||
        null;

      if (directUrl) {
        return res.json({
          status: "ready",
          title: "YouTube Download",
          url: directUrl,
          ext: isAudio ? "mp3" : "mp4"
        });
      }

      return res.status(502).json({
        error: cobaltData?.text || "YouTube download link ထုတ်ယူ၍မရပါ။"
      });
    }

    return res.status(400).json({ error: "TikTok သို့မဟုတ် YouTube လင့်ခ်များကိုသာ ပံ့ပိုးပါသည်။" });
  } catch (err) {
    console.error("Inspect error:", err);
    return res.status(500).json({ error: "ဆာဗာအတွင်း အမှားအယွင်း ဖြစ်သွားပါသည်။" });
  }
});

// Direct File Stream Proxy (Forces Download Without Media Player)
app.get("/api/download", async (req, res) => {
  try {
    const fileUrl = String(req.query?.url || "").trim();
    const ext = String(req.query?.ext || "mp4").toLowerCase() === "mp3" ? "mp3" : "mp4";

    if (!fileUrl) {
      return res.status(400).send("Missing URL");
    }

    let parsed;
    try {
      parsed = new URL(fileUrl);
    } catch {
      return res.status(400).send("Invalid URL");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).send("Invalid protocol");
    }

    const upstream = await fetch(parsed.toString());
    if (!upstream.ok || !upstream.body) {
      return res.status(502).send("Upstream download failed");
    }

    const mimeType = ext === "mp3" ? "audio/mpeg" : "video/mp4";
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="moe-dee-download.${ext}"`);

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error("Download error:", err);
    if (!res.headersSent) {
      res.status(500).send("Download error");
    }
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`MR. MOE DEE DOWNLOAD ENGINE running on port ${PORT}`);
});
