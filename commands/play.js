const yts = require('yt-search');
const axios = require('axios');

const REPLY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes — adjust if you want longer

async function playCommand(sock, chatId, message) {
    try {
        // Normalize incoming text
        const rawText =
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            '';

        // If user replied/quoted a message that contains a URL/text, prefer that when no arg provided
        const quoted =
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
            '';

        // Remove leading command (.play, .song, etc.) safely
        // This removes .play or !play or /play at start, case-insensitive
        const withoutCmd = rawText.replace(/^\s*(?:[.\/!])?(?:play|song|yt)\b/i, '').trim();

        // Determine search query priority:
        // 1) if user provided argument after command use it
        // 2) else if user quoted a message use quoted text
        // 3) else treat as empty -> prompt user
        const searchQuery = withoutCmd || quoted || '';

        if (!searchQuery) {
            return await sock.sendMessage(
                chatId,
                { text: "What song do you want to download? Usage: .play <name or url> (or reply to a message with a link)" },
                { quoted: message }
            );
        }

        // If searchQuery looks like a YouTube URL include it unchanged; yt-search handles URLs too.
        // Inform user
        await sock.sendMessage(chatId, { text: "_Please wait, fetching song info..._" }, { quoted: message });

        // Search YouTube (yt-search accepts URLs or text)
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, { text: "No songs found for that query." }, { quoted: message });
        }

        const video = videos[0];
        const videoUrl = video.url;

        // Fetch audio data from API (adjust API if you want)
        const apiResp = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(videoUrl)}`, { timeout: 30000 });
        const apiData = apiResp.data;

        if (!apiData || !apiData.status || !apiData.result || !apiData.result.downloadUrl) {
            return await sock.sendMessage(chatId, { text: "Failed to fetch audio from the API. Please try again later." }, { quoted: message });
        }

        const songData = apiData.result; // contains downloadUrl, title, maybe filesize, etc.

        // Build song info caption
        const songInfo =
            `╭───『 🎧 *ꜱᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ* 』──\n` +
            `│ 📀 Title: ${songData.title || video.title || "Unknown"}\n` +
            `│ ⏱️ Duration: ${video.timestamp || "Unknown"}\n` +
            `│ 👁️ Views: ${video.views?.toLocaleString() || "Unknown"}\n` +
            `│ 🌍 Published: ${video.ago || "Unknown"}\n` +
            `│ 👤 Author: ${video.author?.name || "Unknown"}\n` +
            `│ 🔗 URL: ${videoUrl}\n` +
            `╰──────────\n\n` +
            `╭───⌯ Choose Type ⌯───\n` +
            `│ 1. 🎵 Audio (Play)\n` +
            `│ 2. 📁 Document (Save)\n` +
            `╰───────────────╯\n` +
            `> Powered by Lucky Tech Hub`;

        // Send thumbnail + caption (fallback to text-only)
        let sentMsg;
        try {
            sentMsg = await sock.sendMessage(chatId, {
                image: { url: video.thumbnail },
                caption: songInfo
                
            }, { quoted: message });
        } catch (e) {
            sentMsg = await sock.sendMessage(chatId, { text: songInfo }, { quoted: message });
        }

        // Listener for reply (1 or 2), only in same chat
        const messageListener = async ({ messages }) => {
            try {
                const r = messages[0];
                if (!r?.message) return;
                if (r.key.remoteJid !== chatId) return; // only accept replies from same chat

                const body = r.message.conversation || r.message.extendedTextMessage?.text;
                if (!body) return;

                const normalized = body.trim();
                if (!["1", "2"].includes(normalized)) return;

                // Cleanup first to prevent duplicate handling
                clearTimeout(timeout);
                sock.ev.off("messages.upsert", messageListener);

                // Acknowledge and send
                await sock.sendMessage(chatId, { text: "⏳ Preparing your file..." }, { quoted: r });

                const audioUrl = songData.downloadUrl;
                const fileNameSafe = `${(songData.title || video.title || "audio").replace(/[<>:"\/\\|?*]+/g, "")}.mp3`;

                if (normalized === "1") {
                    // send as playable audio
                    await sock.sendMessage(chatId, {
                        audio: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        fileName: fileNameSafe
                        
                    }, { quoted: r });
                } else {
                    // send as document (save)
                    await sock.sendMessage(chatId, {
                        document: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        fileName: fileNameSafe
                        
                    }, { quoted: r });
                }
            } catch (err) {
                console.error("song reply error:", err);
                try { await sock.sendMessage(chatId, { text: "❌ Download failed. Try again later." }); } catch {}
            }
        };

        // Register listener and a timeout
        sock.ev.on("messages.upsert", messageListener);
        const timeout = setTimeout(() => {
            try {
                sock.ev.off("messages.upsert", messageListener);
                sock.sendMessage(chatId, { text: "⌛ Session timed out. Please use the command again."
                 });
            } catch {}
        }, REPLY_TIMEOUT_MS);

    } catch (error) {
        console.error('Error in playCommand:', error);
        try {
            await sock.sendMessage(chatId, { text: "Download failed. Please try again later."
             }, { quoted: message });
        } catch {}
    }
}

module.exports = playCommand;
