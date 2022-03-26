const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with pong!");
