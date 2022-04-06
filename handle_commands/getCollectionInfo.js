const displayData = require("./utils/displayData.js");
const discordClient = require("../client");
const mongoClient = require("../db");

module.exports = async (interaction) => {
  const enteredCollection = interaction.options.getString("collection-name");
  await interaction.deferReply();
  await interaction.editReply(
    `Getting data from ${enteredCollection}. Please wait`
  );
  try {
    mongoClient.connect(async (e) => {
      if (e) {
        console.log(e);
        if (e.message !== undefined) {
          console.log(e.message);
          interaction.followUp(e.message);
        } else interaction.followUp("An error occured");
        return;
      }
      const collection = mongoClient
        .db("NFT-Database")
        .collection("NFT Collections");
      let returnedCollection = await collection.findOne({
        collection: enteredCollection,
      });
      mongoClient.close();
      if (returnedCollection === null)
        return interaction.followUp(
          `${enteredCollection} is not found, try using /fetchcollectioninfo`
        );
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
    });
  } catch (e) {
    console.log(e);
    if (e.message !== undefined) {
      console.log(e.message);
      interaction.editReply(e.message);
    } else interaction.editReply("An error occured");
  }
};
