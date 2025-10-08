
// commands/weather.js
const axios = require("axios");

// Standalone weather command
async function weatherCommand(sock, chatId, message, q) {
  try {
    if (!q) {
      return await sock.sendMessage(
        chatId,
        { text: "❗ Please provide a city name.\n\n📌 Example: `.weather Kampala`"},
        { quoted: message }
      );
    }

    // 🔑 Use your OpenWeather API key
    const apiKey = "2d61a72574c11c4f36173b627f8cb177";
    const city = q.trim();
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const data = response.data;

    const weatherReport = `
🌍 *Weather Information for ${data.name}, ${data.sys.country}* 🌍

🌡️ *Temperature:* ${data.main.temp}°C
🌡️ *Feels Like:* ${data.main.feels_like}°C
🌡️ *Min Temp:* ${data.main.temp_min}°C
🌡️ *Max Temp:* ${data.main.temp_max}°C
💧 *Humidity:* ${data.main.humidity}%
☁️ *Weather:* ${data.weather[0].main}
🌫️ *Description:* ${data.weather[0].description}
💨 *Wind Speed:* ${data.wind.speed} m/s
🔽 *Pressure:* ${data.main.pressure} hPa

⚡ *Powered By Lucky Tech Hub*
    `.trim();

    await sock.sendMessage(chatId, { text: weatherReport
    }, { quoted: message });
  } catch (e) {
    console.error("weatherCommand error:", e.message || e);

    if (e.response && e.response.status === 404) {
      return await sock.sendMessage(
        chatId,
        { text: "🚫 City not found. Please check the spelling and try again."
         },
        { quoted: message }
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "⚠️ An error occurred while fetching weather info. Please try again later."
       },
      { quoted: message }
    );
  }
}

module.exports = weatherCommand;
