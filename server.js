const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ status: true, name: "MR. MOE DEE DOWNLOADER - Pro No-Watermark" });
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
        
        // TikTok No-Watermark Handler via public API extractor
        if (host.includes('tiktok.com')) {
            try {
                const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`);
                const json = await apiRes.json();
                if (json && json.code === 0 && json.data) {
                    return res.json({
                        status: "direct_link",
                        title: json.data.title || "TikTok Video (No Watermark)",
                        thumbnail: json.data.cover || "",
                        duration: json.data.duration || 0,
                        url: json.data.play || url,
                        message: "TikTok No-Watermark ဗီဒီယိုလင့်ခ် အောင်မြင်စွာ ရရှိပါပြီ။"
                    });
                }
            } catch (err) {
                console.error("TikTok API error:", err);
            }
        }

        // YouTube Handler
        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            let videoId = parsed.searchParams.get("v");
            if (!videoId && host.includes('youtu.be')) {
                videoId = parsed.pathname.slice(1);
            }
            return res.json({
                status: "direct_link",
                title: "YouTube Video",
                thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
                duration: 0,
                url: url,
                message: "YouTube ဗီဒီယိုလင့်ခ် အောင်မြင်စွာ ရရှိပါပြီ။"
            });
        }

        return res.status(400).json({ error: "ပံ့ပိုးမထားသော လင့်ခ်ဖြစ်နေပါသည်။ TikTok သို့မဟုတ် YouTube လင့်ခ်ကိုသာ ထည့်ပါ။" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "ဆာဗာအတွင်း အမှားအယွင်း ဖြစ်သွားပါသည်" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`MR. MOE DEE DOWNLOADER No-Watermark running on port ${PORT}`);
});
