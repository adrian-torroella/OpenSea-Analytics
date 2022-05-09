const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
  .setName("getcsvfile")
  .setDescription(
    "Get CSV File For a Collection Containing Token IDs that have Certain Traits"
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
  .addStringOption((option) =>
    option
      .setName("trait-numeric-filters")
      .setDescription(
        "Enter the desired numeric filters on traits seperated by semicolons"
      )
      .setRequired(false)
  );
