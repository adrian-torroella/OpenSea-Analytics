const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
  .setName("get-highest-offers-info")
  .setDescription(
    "Show minumum, maximum and mean of highest bids on items with given trait"
  )
  .addStringOption((option) =>
    option
      .setName("collection-name")
      .setDescription("Enter a collection name")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("traits")
      .setDescription("Enter the desired traits seperated by semicolons")
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("force-fetch").setDescription("Forcefuly fetch new offers")
  );
