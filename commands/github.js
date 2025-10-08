const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/Tomilucky218/Lucky-XD2');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();
    


    let txt = `🚀 *L T H REPO INFO* 🚀

╭────────────━⊷
┊⭘ 🤖 *Name:* ${json.name}
┊⭘ ⭐ *Stars:* ${json.stargazers_count}
┊⭘ 🍴 *Forks:* ${json.forks_count}
┊⭘ 🥸 *Watchers* : ${json.watchers_count}
┊⭘ 👤 *Owner:* Lucky 218
┊⭘ 🕰️ *Last Updated* : ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}
┊⭘ 📦 *Size* : ${(json.size / 1024).toFixed(2)} MB

> 🔓 Unlock the Bot link by completing the 3 task provided then download the bot file.

┊⭘ ʙᴏᴛ ʟɪɴᴋ: https://sub4unlock.io/ymMe4
╰────────━⊷
    `;
   

    // Use the local asset image
    const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
    const imgBuffer = fs.readFileSync(imgPath);

    await sock.sendMessage(chatId, { image: imgBuffer, caption: txt }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(chatId, { text: '❌ Error fetching repository information.' }, { quoted: message });
  }
}

module.exports = githubCommand; 
