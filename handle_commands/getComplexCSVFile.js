const path = require("path");
const fs = require("fs");
const parseTraitsString = require("../utils/parseTraitsString");
const generateCSVFile = require("../utils/generateComplexCSVFile");
const readCollectionInfoFromDB = require("../utils/readCollectionInfoFromDB");
const reportError = require("../utils/reportError");

module.exports = async (interaction) => {
  const enteredCollection = interaction.options.getString("collection-name");
  const traitsString = interaction.options.getString("traits");
  const channelId = interaction.channel.id;
  try {
    await interaction.deferReply();
    await interaction.editReply(`Searching for ${enteredCollection}`);
    let returnedCollection = await readCollectionInfoFromDB(enteredCollection);
    if (returnedCollection === null)
      return interaction.followUp(
        `${enteredCollection} is not found, try using /fetchcollectioninfo`
      );
    interaction.followUp(
      `Generating CSV file for ${enteredCollection} with tratis ${traitsString}, please wait.`
    );

    const filteredAssets = applyNumericFilters(assets);
    returnedCollection = null;
    const traits = {};
    for (const tokenId in filteredAssets) {
      traits[tokenId] = {
        ...filteredAssets[tokenId].traits,
      };
    }
    const requiredTraits = parseTraitsString(traitsString);
    delete requiredTraits.pairs;
    const id = await generateCSVFile(enteredCollection, traits, requiredTraits);
    try {
      await fs.promises.access(
        path.join(".", `${enteredCollection}-${id}.csv`),
        fs.constants.F_OK
      );
      await interaction.followUp({
        content: " ",
        files: [path.join(".", `${enteredCollection}-${id}.csv`)],
      });
      fs.promises.rm(path.join(".", `${enteredCollection}-${id}.csv`));
    } catch (err) {
      console.log(err);
      interaction.followUp("Trait(s) not found");
    }
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
