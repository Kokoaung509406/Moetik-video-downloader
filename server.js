const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: true, name: "MR. MOE DEE DOWNLOAD ENGINE + CONVERTER" });
});

app.post("/api/inspect", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    const rawMode = String(req.body?.mode || "hd").trim().toLowerCase();

    let mode = "hd";
    if (rawMode === "sd") mode = "sd";
    else if (rawMode === "mp3") mode = "mp3";
    else if (rawMode === "wav") mode = "wav";
    else if (rawMode === "audio") mode = "mp3";

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
    const isAudioMode = mode === "mp3" || mode === "wav";
    const targetExt = mode === "wav" ? "wav" : mode === "mp3" ? "mp3" : "mp4";

    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
      const json = await apiRes.json();

      if (json && json.code === 0 && json.data) {
        const mediaUrl = isAudioMode
          ? json.data.music || json.data.music_info?.play || json.data.play
          : mode === "sd"
            ? json.data.wmplay || json.data.play
            : json.data.play;

        return res.json({
          status: "ready",
          title: json.data.title || "TikTok Media",
          url: mediaUrl,
          ext: targetExt
        });
      }

      return res.status(502).json({ error: "TikTok လင့်ခ်ကို ဖတ်၍မရပါ။" });
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
      const cobaltRes = await fetch("https://api.cobalt.tools/api/json", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url,
          downloadMode: isAudioMode ? "audio" : "video",
          audioFormat: mode === "wav" ? "wav" : "mp3",
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
          title: "YouTube Media",
          url: directUrl,
          ext: targetExt
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

function cleanupFiles(...paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      fs.unlink(p, () => {});
    }
  }
}

app.get("/api/download", async (req, res) => {
  const fileUrl = String(req.query?.url || "").trim();
  const rawExt = String(req.query?.ext || "mp4").trim().toLowerCase();
  const ext = rawExt === "mp3" ? "mp3" : rawExt === "wav" ? "wav" : "mp4";

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

  const id = crypto.randomBytes(8).toString("hex");
  const tempInput = path.join(os.tmpdir(), `in-${id}`);
  const tempOutput = path.join(os.tmpdir(), `out-${id}.${ext}`);

  try {
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok || !upstream.body) {
      return res.status(502).send("Upstream download failed");
    }

    // Video direct stream without re-encoding
    if (ext === "mp4") {
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="moe-dee-video.mp4"`);
      const reader = upstream.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      return res.end();
    }

    // Save source media temporarily and convert via ffmpeg to real MP3 or WAV
    const arrayBuffer = await upstream.arrayBuffer();
    fs.writeFileSync(tempInput, Buffer.from(arrayBuffer));

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg(tempInput).noVideo();
      if (ext === "mp3") {
        cmd = cmd.audioCodec("libmp3lame").audioBitrate("192k").format("mp3");
      } else if (ext === "wav") {
        cmd = cmd.audioCodec("pcm_s16le").audioFrequency(44100).audioChannels(2).format("wav");
      }
      cmd
        .save(tempOutput)
        .on("end", resolve)
        .on("error", reject);
    });

    const mimeType = ext === "wav" ? "audio/wav" : "audio/mpeg";
    const fileName = `moe-dee-audio.${ext}`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const stream = fs.createReadStream(tempOutput);
    stream.on("close", () => cleanupFiles(tempInput, tempOutput));
    stream.on("error", () => {
      cleanupFiles(tempInput, tempOutput);
      if (!res.headersSent) res.status(500).send("Stream error");
    });
    stream.pipe(res);
  } catch (err) {
    console.error("Download / convert error:", err);
    cleanupFiles(tempInput, tempOutput);
    if (!res.headersSent) {
      res.status(500).send("Download or conversion failed");
    }
  }
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`MR. MOE DEE DOWNLOAD ENGINE + CONVERTER running on port ${PORT}`);
});
