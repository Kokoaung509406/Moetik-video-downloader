const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ status: true, name: "MR. MOE DEE DOWNLOADER - Pro Premium" });
});

app.post('/api/inspect', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "ကျေးဇူးပြု၍ ဗီဒီယိုလင့်ခ် (URL) ထည့်သွင်းပါ။" });
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch (e) {
            return res.status(400).json({ error: "လင့်ခ်ပုံစံ မမှန်ကန်ပါ။" });
        }

        const host = parsed.hostname.toLowerCase();
        const isSupported = host.includes('youtube.com') || host.includes('youtu.be') || host.includes('tiktok.com');

        if (!isSupported) {
            return res.status(400).json({ error: "YouTube သို့မဟုတ် TikTok လင့်ခ်များကိုသာ ပံ့ပိုးပါသည်။" });
        }

        const command = `python3 -m yt_dlp -j "${url}" || yt-dlp -j "${url}" || npx yt-dlp -j "${url}"`;
        
        exec(command, { timeout: 20000 }, (error, stdout, stderr) => {
            if (error) {
                console.error("Extraction error:", error);
                return res.status(500).json({ error: "ဗီဒီယိုအချက်အလက် ထုတ်ယူ၍မရပါ။ လင့်ခ်မှန်ကန်မှု ရှိမရှိ စစ်ဆေးပါ။" });
            }

            try {
                const info = JSON.parse(stdout);
                return res.json({
                    status: "direct_link",
                    title: info.title || "Untitled Video",
                    thumbnail: info.thumbnail || "",
                    duration: info.duration || 0,
                    url: info.url || (info.formats && info.formats.length > 0 ? info.formats[info.formats.length - 1].url : url),
                    message: "ဗီဒီယိုလင့်ခ် အောင်မြင်စွာ ရရှိပါပြီ။"
                });
            } catch (parseErr) {
                return res.status(500).json({ error: "Data parsing အမှားအယွင်း ရှိသွားပါသည်။" });
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "ဆာဗာအတွင်း အမှားအယွင်း ဖြစ်သွားပါသည်" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`MR. MOE DEE DOWNLOADER Pro running on port ${PORT}`);
});
