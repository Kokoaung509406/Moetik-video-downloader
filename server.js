const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ status: true, name: "MR. MOE DEE DOWNLOADER - Pro Ultimate" });
});

app.post('/api/inspect', async (req, res) => {
    try {
        const { url, format } = req.body;
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
        
        // TikTok Handler
        if (host.includes('tiktok.com')) {
            const apiRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`); const json = await apiRes.json(); if (json && json.code === 0 && json.data) { let downloadUrl = json.data.play; // Default HD video if (format === 'mp3' \vert{}\vert{} format === 'wav') { downloadUrl = json.data.music; // Audio link } else if (format === 'SD') { downloadUrl = json.data.wmplay \vert{}\vert{} json.data.play; } return res.json({ status: "direct_link", title: json.data.title \vert{}\vert{} "TikTok Media", thumbnail: json.data.cover \vert{}\vert{} "", url: downloadUrl, message: "အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ။" }); } }  // YouTube Handler via Cobalt / Public Public Extractor if (host.includes('youtube.com') \vert{}\vert{} host.includes('youtu.be')) { let videoId = parsed.searchParams.get("v"); if (!videoId && host.includes('youtu.be')) { videoId = parsed.pathname.slice(1); }  // Using Cobalt public instance API for direct media & audio extraction const cobaltRes = await fetch('https://api.cobalt.tools/api/json', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url, downloadMode: (format === 'mp3' \vert{}\vert{} format === 'wav') ? 'audio' : 'video', audioFormat: format === 'wav' ? 'wav' : 'mp3', videoQuality: format \vert{}\vert{} '720' }) });  const cobaltData = await cobaltRes.json(); if (cobaltData && (cobaltData.status === 'stream' \vert{}\vert{} cobaltData.status === 'redirect' \vert{}\vert{} cobaltData.status === 'picker')) { return res.json({ status: "direct_link", title: "YouTube Media", thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "",
                    url: cobaltData.url || (cobaltData.picker && cobaltData.picker[0]?.url),
                    message: "YouTube လင့်ခ် အောင်မြင်စွာ ရရှိပါပြီ။"
                });
            }
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
    console.log(`MR. MOE DEE DOWNLOADER Ultimate running on port ${PORT}`);
});
