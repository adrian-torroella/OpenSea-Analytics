import { Interaction, Guild, Role, ApplicationCommand } from "discord.js";
// import Guild from "discord.js/src/structures/Guild";
// import Role from "discord.js/src/structures/Role";

require("dotenv").config();
const discordClient = require("./client");

const TOKEN: string | undefined  = process.env.TOKEN;

const handleFetchCollectionInfo = require("./handle_commands/fetchCollectionInfo.js");
const handleGetCollectionInfo = require("./handle_commands/getCollectionInfo.js");
const handleListFetchedCollections = require("./handle_commands/listFetchedCollections.js");
const handleGetCSVFile = require("./handle_commands/getCSVFile");
const handleGetComplexCSVFile = require("./handle_commands/getComplexCSVFile");
const handleGetLowestListedPrice = require("./handle_commands/getLowestListedPrice");
const handleGetHighestOffersInfo = require("./handle_commands/getHighestOffersInfo");

discordClient.on("ready", (): void => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on("guildCreate", async (guild: Guild): Promise<void> => {
  const roles = await guild.roles.fetch();
  let openseaAccessRole = roles.find(
    (role: Role) => role.name === "OpenSea Bot Access"
  );
  if (openseaAccessRole === undefined) {
    openseaAccessRole = await guild.roles.create({
      name: "OpenSea Bot Access",
      color: "#d91455",
    });
  }
  const commandsIds = (await discordClient.application.commands.fetch()).map(
    (command: ApplicationCommand) => command.id
  );
  await Promise.all(
    commandsIds.map((commandId: string) =>
      guild.commands.permissions.set({
        command: commandId,
        permissions: [
          {
            // @ts-ignore
            id: openseaAccessRole.id,
            type: 1,
            permission: true,
          },
        ],
      })
    )
  );
});

discordClient.on("interactionCreate", async (interaction: Interaction) => {
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
