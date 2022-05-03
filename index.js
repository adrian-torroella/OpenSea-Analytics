"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// import Guild from "discord.js/src/structures/Guild";
// import Role from "discord.js/src/structures/Role";
require("dotenv").config();
const discordClient = require("./client");
const TOKEN = process.env.TOKEN;
const handleFetchCollectionInfo = require("./handle_commands/fetchCollectionInfo.js");
const handleGetCollectionInfo = require("./handle_commands/getCollectionInfo.js");
const handleListFetchedCollections = require("./handle_commands/listFetchedCollections.js");
const handleGetCSVFile = require("./handle_commands/getCSVFile");
const handleGetComplexCSVFile = require("./handle_commands/getComplexCSVFile");
const handleGetLowestListedPrice = require("./handle_commands/getLowestListedPrice");
const handleGetHighestOffersInfo = require("./handle_commands/getHighestOffersInfo");
discordClient.on("ready", () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
});
discordClient.on("guildCreate", (guild) => __awaiter(void 0, void 0, void 0, function* () {
    const roles = yield guild.roles.fetch();
    let openseaAccessRole = roles.find((role) => role.name === "OpenSea Bot Access");
    if (openseaAccessRole === undefined) {
        openseaAccessRole = yield guild.roles.create({
            name: "OpenSea Bot Access",
            color: "#d91455",
        });
    }
    const commandsIds = (yield discordClient.application.commands.fetch()).map((command) => command.id);
    yield Promise.all(commandsIds.map((commandId) => guild.commands.permissions.set({
        command: commandId,
        permissions: [
            {
                // @ts-ignore
                id: openseaAccessRole.id,
                type: 1,
                permission: true,
            },
        ],
    })));
}));
discordClient.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isCommand())
        return;
    if (interaction.commandName === "ping") {
        interaction.reply("Pong!");
    }
    else if (interaction.commandName === "fetchcollectioninfo") {
        handleFetchCollectionInfo(interaction);
    }
    else if (interaction.commandName === "getcollectioninfo") {
        handleGetCollectionInfo(interaction);
    }
    else if (interaction.commandName === "listfetchedcollections") {
        handleListFetchedCollections(interaction);
    }
    else if (interaction.commandName === "getcsvfile") {
        handleGetCSVFile(interaction);
    }
    else if (interaction.commandName === "getcomplexcsvfile") {
        handleGetComplexCSVFile(interaction);
    }
    else if (interaction.commandName == "get-lowest-listed-price") {
        handleGetLowestListedPrice(interaction);
    }
    else if (interaction.commandName === "get-highest-offers-info") {
        handleGetHighestOffersInfo(interaction);
    }
}));
discordClient.login(TOKEN);
