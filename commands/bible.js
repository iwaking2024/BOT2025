// commands/bible.js
const axios = require("axios");

async function bibleCommand(sock, chatId, message, q) {
  try {
    if (!q) {
      return await sock.sendMessage(
        chatId,
        {
          text: `⚠️ *Please provide a Bible reference.*\n\n📝 *Example:*\n.bible John 1:1`
          
        },
        { quoted: message }
      );
    }

    const apiUrl = `https://bible-api.com/${encodeURIComponent(q)}`;
    const response = await axios.get(apiUrl);

    if (response.status === 200 && response.data.text) {
      const { reference, translation_name, verses } = response.data;

      // Pull details from the first verse object
      const verseData = verses?.[0] || {};
      const book = verseData.book_name || "Unknown";
      const chapter = verseData.chapter || "Unknown";
      const verse = verseData.verse || "Unknown";
      const text = verseData.text || response.data.text;

      const verseMessage =
        `📜 *𝘽𝙄𝘽𝙇𝙀 𝙑𝙀𝙍𝙎𝙀 𝙁𝙊𝙐𝙉𝘿!* 📜\n\n` +
        `📖 *Reference:* ${reference}\n` +
        `📚 *Book:* ${book}\n` +
        `🔢 *Chapter:* ${chapter}\n` +
        `🔤 *Verse:* ${verse}\n\n` +
        `📖 *Text:* ${text.trim()}\n\n` +
        `🗂️ *Translation:* ${translation_name}\n\n` +
        `> © Powered By Lucky Tech Hub`;

      await sock.sendMessage(chatId, { text: verseMessage
      }, { quoted: message });
    } else {
      await sock.sendMessage(
        chatId,
        { text: "❌ *Verse not found.* Please check the reference and try again."
         },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Bible command error:", error.message || error);
    await sock.sendMessage(
      chatId,
      { text: "⚠️ *An error occurred while fetching the Bible verse.* Please try again."
       },
      { quoted: message }
    );
  }
}

module.exports = bibleCommand;
