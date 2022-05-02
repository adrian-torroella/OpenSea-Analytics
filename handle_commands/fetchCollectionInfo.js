const axios = require("axios");
const fetchQueueConsumer = require("../fetchQueueConsumer");

const raxConfig = {
  retry: 5,
  retryDelay: 5000,
  backoffType: "static",
};

const headers = {
  "X-API-KEY": process.env.apiKey,
};

const getNumberOfItemsAndContractAddress = async (enteredCollection) => {
  const collectionEndpoint = `https://api.opensea.io/api/v1/collection/${enteredCollection}`;
  const result = await axios.get(collectionEndpoint, {
    raxConfig,
    headers,
  });
  if (result.status === 404) {
    return {
      numberOfItems: null,
      contractAddress: null,
    };
  }
  return {
    numberOfItems: result.data.collection.stats.total_supply,
    contractAddress: result.data.collection.primary_asset_contracts[0].address,
  };
};

module.exports = async (interaction) => {
  const enteredCollection = interaction.options.getString("collection-name");
  await interaction.deferReply();
  try {
    const { numberOfItems, contractAddress } =
      await getNumberOfItemsAndContractAddress(enteredCollection);
    if (!numberOfItems) {
      return await interaction.editReply(
        `Collection doesn't exist or has no items`
      );
    }

    const interactionOptionStart = interaction.options.getNumber("start");
    const interactionOptionStep = interaction.options.getNumber("step");
    const interactionOptionNumberOfSteps =
      interaction.options.getNumber("number-of-steps");

    const interactionOptions = {
      start: interactionOptionStart,
      step: interactionOptionStep,
      numberOfSteps: interactionOptionNumberOfSteps,
    };

    interaction.editReply(
      `Fetching data from ${enteredCollection}. Please wait, this could take a long time.`
    );

    fetchQueueConsumer.add({
      assets: {},
      begun: false,
      collectionName: enteredCollection,
      contractAddress,
      channelId: interaction.channel.id,
      cursor: null,
      interactionOptions,
    });
  } catch (e) {
    console.log(e);
    console.log(e.response);
    if (e.message !== undefined) {
      console.log(e.message);
      interaction.followUp(e.message);
    } else interaction.followUp("An error occured");
  }
};
