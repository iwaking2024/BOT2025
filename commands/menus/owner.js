const settings = require('../../settings');
const path = require('path');
const fs = require('fs');

const imagePath = path.join(__dirname, '../../assets/bot_image.jpg');

module.exports = async (sock, chatId, message) => {
    const caption = `
╭═✦〔 ✅ *ꜱᴇʟᴇᴄᴛᴇᴅ* ✅ 〕✦═╮
│🛠️ ᴘʀᴇғɪx  : [ ${settings.prefix} ]
│🚀 ᴠᴇʀsɪᴏɴ : *${settings.version}*
╰═══⭘════════════⚬═╯
 
╭═✦〔 🔒 *ᴏᴡɴᴇʀ ᴄᴍᴅꜱ* 〕✦═╮
│
│🔹 .mode
│🔹 .block
│🔹 .unblock
│🔹 .blocked or .blocklist
│🔹 .autostatus
│🔹 .clearsession
│🔹 .antidelete
│🔹 .cleartmp
│🔹 .update
│🔹 .settings
│🔹 .setpp <reply to image>
│🔹 .autostatus <on/off>
│🔹 .autostatus react <on/off>
│🔹 .autotyping <on/off>
│🔹 .autorecording <on/off>
│🔹 .autoread <on/off>
│🔹 .anticall <on/off>
│🔹 .pmblocker <on/off/status>
│🔹 .pmblocker setmsg <text>
│🔹 .autostatus delay <time>
│
╰═✪╾✦═✦═✦═✦═✦╼✪═╯

> ${settings.caption}
`;

    let imageBuffer = null;
    if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath);
    }

    await sock.sendMessage(chatId, {
        ...(imageBuffer ? { image: imageBuffer } : {}),
        caption,
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363420656466131@newsletter',
                newsletterName: 'Lucky Tech Hub Bot',
                serverMessageId: -1
            }
        }
    }, { quoted: message });

    await sock.sendMessage(chatId, {
        react: { text: '📂', key: message.key }
    });
};
