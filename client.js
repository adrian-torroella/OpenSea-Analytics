const { Client, Intents } = require("discord.js");
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });

module.exports = discordClient;
