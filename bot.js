const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const options = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "Astronomy Picture of the Day", callback_data: "APOD" }],
      [{ text: "Generate Curiosity Photo", callback_data: "curiosity" }],
      [{ text: "Mars Weather", callback_data: "Mars_Weather" }],
    ],
  },
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (msg.text.startsWith("/")) return;
  initialprompt = "You are Astrodude, an AI assistant created by AstrodudeHQ. You are a helpful assistant that can answer questions and help with tasks. You are also a good friend and can chat with the user. You will only answer in short until asked to. You will only answer questions related to Space and astronomy if asked something else simply reply by ask chatgpt if you want me to answer that. :p so now here is my prompt =>";
  prompt = initialprompt + msg.text;
  const ai = await AstrodudeAI(prompt);
  bot.sendMessage(chatId,ai);
});

bot.onText(/\/options/, (msg) => {
  const chatId = msg.chat.id;
  console.log(chatId);
  console.log(msg);

  // Send inline keyboard
  bot.sendMessage(chatId, "Choose an option:", options);
});

bot.onText(/\/notes/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Notes \n\n For Notes use /notes \n For Options use /options \n For any change contact @AstrodudeHQ`
  );
});

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  if (data == "curiosity") {
    const photo = await curiosity();
    bot.sendMessage(chatId, photo);
  }

  if (data == "APOD") {
    const photo = await APOD();
    bot.sendMessage(chatId, photo.url);
    bot.sendMessage(chatId, photo.title);
    bot.sendMessage(chatId, photo.explanation);
  }

  if (data == "Mars_Weather") {
    const weather = await Mars_Weather();
    for (let i = 0; i < weather.length; i++) {
      bot.sendMessage(chatId, weather[i]);
    }
  }
});

const curiosity = async () => {
  const response = await axios.get(
    `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&page=2&api_key=${process.env.NASA_API_KEY}`
  );
  return response.data.photos[0].img_src;
};

const APOD = async () => {
  const response = await axios.get(
    `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`
  );
  console.log(response.data);
  return response.data;
};

const Mars_Weather = async () => {
  try {
    const response = await axios.get(
      `https://api.nasa.gov/insight_weather/?api_key=${process.env.NASA_API_KEY}&feedtype=json&ver=1.0`
    );
    const data = response.data;

    const array = [];

    for (let i = 0; i < data.sol_keys.length; i++) {
      const latestSolKey = data.sol_keys[i];
      const latestSolData = data[latestSolKey];
      const description = `Mars Weather Report (Sol ${latestSolKey}):------------------------------------------ Average Temperature: ${latestSolData.AT.av.toFixed(
        2
      )}°C- Min: ${latestSolData.AT.mn.toFixed(
        2
      )}°C, Max: ${latestSolData.AT.mx.toFixed(
        2
      )}°C- Wind Speed: ${latestSolData.HWS.av.toFixed(
        2
      )} m/s- Min: ${latestSolData.HWS.mn.toFixed(
        2
      )} m/s, Max: ${latestSolData.HWS.mx.toFixed(
        2
      )} m/s- Atmospheric Pressure: ${latestSolData.PRE.av.toFixed(
        2
      )} Pa- Min: ${latestSolData.PRE.mn.toFixed(
        2
      )} Pa, Max: ${latestSolData.PRE.mx.toFixed(
        2
      )} Pa- Northern Hemisphere Season: ${
        latestSolData.Northern_season
      }- Southern Hemisphere Season: ${
        latestSolData.Southern_season
      }- Earth Date: ${new Date(
        latestSolData.First_UTC
      ).toDateString()} to ${new Date(
        latestSolData.Last_UTC
      ).toDateString()}More information: https://mars.nasa.gov/insight/weather/`;
      await array.push(description);
    }
    return array;
  } catch (error) {
    console.error("Error fetching Mars weather data:", error.message);
    return "There was an error fetching Mars weather data. Please try again later.";
  }
};

const AstrodudeAI = async (msg) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = msg;
  const result = await model.generateContent(prompt);
  return result.response.text();
};
