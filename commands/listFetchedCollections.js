const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
  .setName("listfetchedcollections")
  .setDescription("Lists the fetched collections")
  .setDefaultPermission(false);
