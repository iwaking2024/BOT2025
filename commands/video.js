const axios = require('axios');
const yts = require('yt-search');


const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            await sock.sendMessage(chatId, {
                text: "🎥 *Usage:* `.video <video name or url>`\n💡 Example: `.video despacito`"
                
            }, { quoted: message });
            return;
        }

        let videoUrl = '';
        let videoInfo = null;

        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
            const { videos } = await yts(videoUrl);
            videoInfo = videos ? videos[0] : null;
        } else {
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: "❌ No videos found!" }, { quoted: message });
                return;
            }
            videoInfo = videos[0];
            videoUrl = videoInfo.url;
        }

        const videoCaption =
            `╭───『 🎬 *ᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 』──\n` +
            `│ 📀 Title: ${videoInfo?.title || "Unknown"}\n` +
            `│ ⏱️ Duration: ${videoInfo?.timestamp || "Unknown"}\n` +
            `│ 👁️ Views: ${videoInfo?.views?.toLocaleString() || "Unknown"}\n` +
            `│ 🌍 Published: ${videoInfo?.ago || "Unknown"}\n` +
            `│ 👤 Author: ${videoInfo?.author?.name || "Unknown"}\n` +
            `│ 🔗 URL: ${videoUrl}\n` +
            `╰──────────\n\n` +
            `╭───⌯ Choose Type ⌯───\n` +
            `│ 1️⃣ 🎬 Play (Video)\n` +
            `│ 2️⃣ 📁 Save (Document)\n` +
            `╰───────────────╯\n` +
            `> Powered by Lucky Tech Hub`;

        const sentMsg = await sock.sendMessage(chatId, {
            image: { url: videoInfo?.thumbnail },
            caption: videoCaption
            
        }, { quoted: message });

        // Fetch video via Izumi API
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=720`;
        const res = await axios.get(apiUrl, { timeout: 30000 });
        if (!res.data || !res.data.result || !res.data.result.download) {
            throw new Error("Izumi API failed to return a valid video link.");
        }
        const videoData = res.data.result;

        // ✅ Multi-reply handler
        const messageID = sentMsg.key.id;
        const handler = async (msgData) => {
            try {
                const rMsg = msgData.messages[0];
                if (!rMsg?.message) return;

                const body = rMsg.message.conversation || rMsg.message.extendedTextMessage?.text;
                if (!body) return;

                const choice = body.trim();
                const isReply = rMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (isReply && (choice === "1" || choice === "2")) {
                    if (choice === "1") {
                        await sock.sendMessage(chatId, {
                            video: { url: videoData.download },
                            mimetype: "video/mp4",
                            fileName: `${videoData.title || "video"}.mp4`,
                            caption: `▶️ *Now Playing:* ${videoData.title || "Video"}`
                            
                        }, { quoted: rMsg });
                    } else if (choice === "2") {
                        await sock.sendMessage(chatId, {
                            document: { url: videoData.download },
                            mimetype: "video/mp4",
                            fileName: `${videoData.title || "video"}.mp4`,
                            caption: `💾 *Saved:* ${videoData.title || "Video"}`
                            
                        }, { quoted: rMsg });
                    }

                    // React each time ✅
                    await sock.sendMessage(chatId, {
                        react: { text: '✅', key: rMsg.key }
                    });
                }
            } catch (err) {
                console.error("Reply handler error:", err);
            }
        };

        sock.ev.on("messages.upsert", handler);

        // ⏳ Keep session alive for 5 minutes (multiple replies allowed)
        setTimeout(() => sock.ev.off("messages.upsert", handler), 5 * 60 * 1000);

    } catch (error) {
        console.error("[VIDEO] Command Error:", error?.message || error);
        await sock.sendMessage(chatId, { text: "❌ Download failed: " + (error?.message || "Unknown error") }, { quoted: message });
    }
}

module.exports = videoCommand;
