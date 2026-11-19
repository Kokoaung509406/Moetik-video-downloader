const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: true, name: "MR. MOE DEE DOWNLOADER - Pro Ultimate" });
});

app.post("/api/inspect", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    const format = String(req.body?.format || "720").trim();

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

    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const json = await apiRes.json();

      if (json && json.code === 0 && json.data) {
        let downloadUrl = json.data.play;
        if (format === "mp3" || format === "wav") {
          downloadUrl = json.data.music || json.data.play;
        } else if (format === "480") {
          downloadUrl = json.data.wmplay || json.data.play;
        }

        return res.json({
          status: "direct_link",
          title: json.data.title || "TikTok Media",
          thumbnail: json.data.cover || "",
          url: downloadUrl
        });
      }

      return res.status(502).json({ error: "TikTok ဗီဒီယိုအချက်အလက် ထုတ်ယူ၍မရပါ။" });
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
      let videoId = parsed.searchParams.get("v");
      if (!videoId && host === "youtu.be") {
        videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      }

      const cobaltRes = await fetch("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          downloadMode: format === "mp3" || format === "wav" ? "audio" : "video",
          audioFormat: format === "wav" ? "wav" : "mp3",
          videoQuality: format === "480" ? "480" : "720"
        })
      });

      const cobaltData = await cobaltRes.json().catch(() => null);
      const directUrl =
        cobaltData?.url ||
        (Array.isArray(cobaltData?.picker) && cobaltData.picker[0]?.url) ||
        null;

      if (directUrl) {
        return res.json({
          status: "direct_link",
          title: "YouTube Media",
          thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
          url: directUrl
        });
      }

      return res.status(502).json({
        error: cobaltData?.text || "YouTube direct link ထုတ်ယူ၍မရသေးပါ။"
      });
    }

    return res.status(400).json({ error: "TikTok သို့မဟုတ် YouTube လင့်ခ်များကိုသာ ပံ့ပိုးပါသည်။" });
  } catch (err) {
    console.error("Inspect error:", err);
    return res.status(500).json({ error: "ဆာဗာအတွင်း အမှားအယွင်း ဖြစ်သွားပါသည်။" });
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`MR. MOE DEE DOWNLOADER running on port ${PORT}`);
});
