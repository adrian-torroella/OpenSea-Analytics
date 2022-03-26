const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
  .setName("getcollectioninfo")
  .setDescription("Fetch info of a collection")
  .addStringOption((option) =>
    option
      .setName("collection-name")
      .setDescription("Enter a collection name")
      .setRequired(true)
  )
  .addNumberOption((option) =>
    option.setName("step").setDescription("Enter the step").setRequired(true)
  )
  .addNumberOption((option) =>
    option
      .setName("number-of-steps")
      .setDescription("Enter the number of steps")
      .setRequired(true)
  )
  .addNumberOption((option) =>
    option.setName("start").setDescription("Enter the starting price")
  )
  .setDefaultPermission(false);
