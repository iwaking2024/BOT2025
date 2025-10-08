const axios = require('axios');
const yts = require('yt-search');

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        
        // ✅ Fancy boxed usage message
        if (!text || text.trim() === ".song") {
            const usageMsg =
                `╭───『 🎧 *ꜱᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 』──\n` +
                `│ 🎵 *Usage:* .song <query/url>\n` +
                `│ 📌 Example:\n` +
                `│ .song https://youtu.be/ox4tmEV6-QU\n` +
                `│ .song Alan Walker faded\n` +
                `╰───────────────╯\n\n` +
                `> Powered by Lucky Tech Hub`;

            await sock.sendMessage(chatId, { text: usageMsg
             }, { quoted: message });
            return;
        }

        let video, videoInfo, videoUrl;
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            videoUrl = text;
            videoInfo = await yts({ videoId: text.split("v=")[1] });
            video = { url: videoUrl, title: videoInfo.title, thumbnail: videoInfo.thumbnail };
        } else {
            const search = await yts(text);
            if (!search || !search.videos.length) {
                await sock.sendMessage(chatId, { text: 'No results found.' }, { quoted: message });
                return;
            }
            video = search.videos[0];
            videoUrl = video.url;
            videoInfo = video;
        }

        // Call Izumi API
        const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=mp3`;
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            throw new Error('Izumi API failed to return a valid link.');
        }

        const songData = res.data.result;

        // Build song info message
        const songInfo =
            `╭───『 🎧 *ꜱᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 』──\n` +
            `│ 📀 Title: ${songData.title || videoInfo?.title || "Unknown"}\n` +
            `│ ⏱️ Duration: ${videoInfo?.timestamp || "Unknown"}\n` +
            `│ 👁️ Views: ${videoInfo?.views?.toLocaleString() || "Unknown"}\n` +
            `│ 🌍 Published: ${videoInfo?.ago || "Unknown"}\n` +
            `│ 👤 Author: ${videoInfo?.author?.name || "Unknown"}\n` +
            `│ 🔗 URL: ${videoUrl}\n` +
            `╰──────────\n\n` +
            `╭───⌯ Choose Type ⌯───\n` +
            `│ 1. 🎵 Audio (Play)\n` +
            `│ 2. 📁 Document (Save)\n` +
            `╰───────────────╯\n` +
            `> Powered by Lucky Tech Hub`;

        // Send song info with thumbnail
        const sentMsg = await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: songInfo
            
        }, { quoted: message });

        // Listener for reply (1 or 2)
        const messageListener = async ({ messages }) => {
            try {
                const r = messages[0];
                if (!r?.message) return;

                const body = r.message.conversation || r.message.extendedTextMessage?.text;
                if (!body) return;

                const normalized = body.trim();
                const isReplyToSong = r.message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

                if (!["1", "2"].includes(normalized)) return;
                if (!isReplyToSong && r.key.remoteJid !== chatId) return;

                clearTimeout(timeout);
                sock.ev.off("messages.upsert", messageListener);

                await sock.sendMessage(chatId, { text: "⏳ Downloading audio..." }, { quoted: r });

                if (normalized === "1") {
                    await sock.sendMessage(chatId, {
                        audio: { url: songData.download },
                        mimetype: "audio/mpeg",
                        fileName: `${songData.title || videoInfo?.title || 'song'}.mp3`
                        
                    }, { quoted: r });
                } else {
                    await sock.sendMessage(chatId, {
                        document: { url: songData.download },
                        mimetype: "audio/mpeg",
                        fileName: `${songData.title || videoInfo?.title || 'song'}.mp3`
                        
                    }, { quoted: r });
                }
            } catch (err) {
                console.error("song reply error:", err);
                await sock.sendMessage(chatId, { text: "❌ Download failed. Try again later." });
            }
        };

        sock.ev.on("messages.upsert", messageListener);

        // Timeout after 60s
        const timeout = setTimeout(() => {
            sock.ev.off("messages.upsert", messageListener);
            sock.sendMessage(chatId, { text: "⌛ Session timed out. Please use the command again." });
        }, 60000);

    } catch (err) {
        console.error('Song command error:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to download song.' }, { quoted: message });
    }
}

module.exports = songCommand;
