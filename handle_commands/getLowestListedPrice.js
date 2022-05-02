const { MessageEmbed } = require("discord.js");
const getThreeSmallestItems = require("../utils/getThreeSmallestItems");
const parseTraitsString = require("../utils/parseTraitsString");
const readCollectionInfoFromDB = require("../utils/readCollectionInfoFromDB");
const reportError = require("../utils/reportError");

const generateEmbedFeilds = (lowestPrices, isPair) => {
  const fields = [];
  for (const trait in lowestPrices) {
    if (isPair) {
      fields.push({
        name: `${trait.split(":")[0][0].toUpperCase()}${trait
          .split(":")[0]
          .slice(1)} : ${trait.split(":")[1][0].toUpperCase()}${trait
          .split(":")[1]
          .slice(1)}`,
        value: "============================",
      });
    } else {
      fields.push({
        name: `${trait[0].toUpperCase()}${trait.slice(1)}`,
        value: "============================",
      });
    }
    for (let i = 0; i < 3; i++) {
      fields.push({
        name: `Token Id: ${lowestPrices[trait][i].split(":")[0]}`,
        value: `Price: ${lowestPrices[trait][i].split(":")[1]} ETH`,
      });
    }
    fields.push({
      name: "\u200B",
      value: "\u200B",
    });
  }
  fields.pop();
  return fields;
};

const displayPricesEmbed = (lowestPrices, isPair) => {
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Lowest three listed prices")
    .setTimestamp(new Date())
    .addFields(...generateEmbedFeilds(lowestPrices, isPair));
};

module.exports = async (interaction) => {
  const enteredCollection = interaction.options.getString("collection-name");
  const traitsString = interaction.options.getString("traits");

  try {
    await interaction.deferReply();
    await interaction.editReply(`Searching for ${enteredCollection}`);
    let returnedCollection = await readCollectionInfoFromDB(enteredCollection);
    if (returnedCollection === null)
      return interaction.followUp(
        `${enteredCollection} is not found, try using /fetchcollectioninfo`
      );
    interaction.followUp(`Getting lowest prices, please wait.`);
    const requiredTraits = parseTraitsString(traitsString);
    const lowestThreePrices = {};
    const isPair = requiredTraits.pairs;
    const prices = {};
    const traits = {};
    for (const tokenId in returnedCollection.assets) {
      if (returnedCollection.assets[tokenId].price)
        prices[tokenId] = returnedCollection.assets[tokenId].price;
      traits[tokenId] = {
        ...returnedCollection.assets[tokenId].traits,
      };
    }
    returnedCollection = null;
    for (const requiredTraitIndex in requiredTraits) {
      if (requiredTraitIndex === "pairs") continue;
      if (isPair) {
        for (const requiredTrait of requiredTraits[requiredTraitIndex]) {
          lowestThreePrices[`${requiredTraitIndex}:${requiredTrait}`] =
            getThreeSmallestItems(
              prices,
              traits,
              requiredTraitIndex,
              requiredTrait,
              isPair
            );
        }
      } else
        lowestThreePrices[requiredTraitIndex] = getThreeSmallestItems(
          prices,
          traits,
          requiredTraitIndex,
          requiredTraits[requiredTraitIndex],
          isPair
        );
    }
    interaction.followUp({
      content: " ",
      embeds: [displayPricesEmbed(lowestThreePrices, isPair)],
    });
  } catch (err) {
    console.log(err);
    if (err instanceof MongoError) {
      reportError(
        channelId,
        "Error occured while connecting to the database, try again later."
      );
    } else {
      reportError(channelId, "An unexpected error occured, try again later.");
    }
  }
};
