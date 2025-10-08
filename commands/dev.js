// commands/dev.js
async function devCommand(sock, chatId, message, q) {
  try {
    const senderJid = message.key?.participant || message.key?.remoteJid || message.sender || '';
    const pushname =
      message.pushName ||
      message.message?.pushName ||
      (senderJid ? senderJid.split('@')[0] : 'there');

    const name = pushname || 'there';

    const caption = `
╭─⌈ *👨‍💻 ʟ ᴛ ʜ ʙᴏᴛ ᴅᴇᴠᴇʟᴏᴘᴇʀ* ⌋─
│
│ 👋 Hello, *${name}*!
│
│ 🤖 I'm *Lucky 218*, the creator and
│    maintainer of this smart WhatsApp bot.
│
│ 👨‍💻 *ᴅᴇᴠ ɪɴꜰᴏ:*
│ ──────────
│ 🧠 *Name:* Lucky 218
│ 🎂 *Age:* +24
│ 📞 *Contact:* wa.me/256789966218
│ 📺 *YouTube:* Lucky Tech Hub
│     https://youtube.com/@luckytechhub-i9u
│
╰─────────

>⚡Powered By Lucky Tech Hub
    `.trim();

    const contextInfo = {
      mentionedJid: senderJid ? [senderJid] : [],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363420656466131@newsletter",
        newsletterName: "🪀『 ʟᴜᴄᴋʏ ᴛᴇᴄʜ ʜᴜʙ ʙᴏᴛ 』🪀",
        serverMessageId: 143
      },
      externalAdReply: {
        title: "ʟᴜᴄᴋʏ ᴛᴇᴄʜ ʜᴜʙ ʙᴏᴛ",
        body: "Created with ❤️ by Lucky 218",
        thumbnailUrl: "https://files.catbox.moe/suqejh.jpg",
        mediaType: 1,
        renderSmallerThumbnail: true,
        showAdAttribution: true,
        mediaUrl: "https://youtube.com/@luckytechhub-i9u",
        sourceUrl: "https://youtube.com/@luckytechhub-i9u"
      }
    };

    await sock.sendMessage(
      chatId,
      {
        image: { url: "https://files.catbox.moe/suqejh.jpg" },
        caption,
        contextInfo
      },
      { quoted: message }
    );
  } catch (err) {
    console.error("devCommand error:", err);
    await sock.sendMessage(chatId, { text: `❌ Error showing dev info: ${err.message}` }, { quoted: message });
  }
}

module.exports = devCommand;
