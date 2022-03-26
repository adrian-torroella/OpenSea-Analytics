require("dotenv").config();
const { Client, Intents } = require("discord.js");
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });
const TOKEN = process.env.TOKEN || null;

const handleFetchCollectionInfo = require("./handle_commands/fetchCollectionInfo.js");
const handleGetCollectionInfo = require("./handle_commands/getCollectionInfo.js");
const handleListFetchedCollections = require("./handle_commands/listFetchedCollections.js");
const handleGetCSVFile = require("./handle_commands/getCSVFile");
const handleGetComplexCSVFile = require("./handle_commands/getComplexCSVFile");
const handleGetLowestListedPrice = require("./handle_commands/getLowestListedPrice");
const handleGetHighestOffersInfo = require("./handle_commands/getHighestOffersInfo");

// Create Object.filter for convenience
Object.filter = (obj, predicate) =>
  Object.keys(obj)
    .filter((key) => predicate(obj[key]))
    .reduce((res, key) => ((res[key] = obj[key]), res), {});

discordClient.on("ready", async () => {
  Array.prototype.min = function () {
    return Math.min.apply(null, this);
  };
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on("guildCreate", async (guild) => {
  const roles = await guild.roles.fetch();
  let openseaAccessRole = roles.find(
    (role) => role.name === "OpenSea Bot Access"
  );
  if (openseaAccessRole === undefined) {
    openseaAccessRole = await guild.roles.create({
      name: "OpenSea Bot Access",
      color: "#d91455",
    });
  }
  const commandsIds = (await discordClient.application.commands.fetch()).map(
    (command) => command.id
  );
  await Promise.all(
    commandsIds.map((commandId) =>
      guild.commands.permissions.set({
        command: commandId,
        permissions: [
          {
            id: openseaAccessRole.id,
            type: 1,
            permission: true,
          },
        ],
      })
    )
  );
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    interaction.reply("Pong!");
  } else if (interaction.commandName === "fetchcollectioninfo") {
    handleFetchCollectionInfo(interaction);
  } else if (interaction.commandName === "getcollectioninfo") {
    handleGetCollectionInfo(interaction);
  } else if (interaction.commandName === "listfetchedcollections") {
    handleListFetchedCollections(interaction);
  } else if (interaction.commandName === "getcsvfile") {
    handleGetCSVFile(interaction);
  } else if (interaction.commandName === "getcomplexcsvfile") {
    handleGetComplexCSVFile(interaction);
  } else if (interaction.commandName == "get-lowest-listed-price") {
    handleGetLowestListedPrice(interaction);
  } else if (interaction.commandName === "get-highest-offers-info") {
    handleGetHighestOffersInfo(interaction);
  }
});

discordClient.login(TOKEN);
