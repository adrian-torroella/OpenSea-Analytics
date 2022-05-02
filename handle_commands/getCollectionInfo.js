const { MongoError } = require("mongodb");
const displayData = require("../utils/displayData.js");
const readCollectionInfoFromDB = require("../utils/readCollectionInfoFromDB.js");
const reportError = require("../utils/reportError");
const discordClient = require("../client");

module.exports = async (interaction) => {
  const enteredCollection = interaction.options.getString("collection-name");
  const channelId = interaction.channel.id;
  try {
    await interaction.deferReply();
    await interaction.editReply(
      `Getting data from ${enteredCollection}. Please wait`
    );
    let returnedCollection = await readCollectionInfoFromDB(enteredCollection);
    if (returnedCollection === null) {
      return interaction.followUp(
        `${enteredCollection} is not found, try using /fetchcollectioninfo`
      );
    }
    const prices = {};
    for (const tokenId in returnedCollection.assets) {
      if (returnedCollection.assets[tokenId].price)
        prices[tokenId] = returnedCollection.assets[tokenId].price;
    }
    const timestamp = returnedCollection.timestamp;
    returnedCollection = null;
    const channelId = interaction.channel.id;

    const interactionOptionStart = interaction.options.getNumber("start");
    const interactionOptionStep = interaction.options.getNumber("step");
    const interactionOptionNumberOfSteps =
      interaction.options.getNumber("number-of-steps");

    const interactionOptions = {
      start: interactionOptionStart,
      step: interactionOptionStep,
      numberOfSteps: interactionOptionNumberOfSteps,
    };

    displayData(
      discordClient,
      channelId,
      enteredCollection,
      prices,
      timestamp,
      interactionOptions
    );
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
