const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const [CLIENT_ID, TOKEN] = [
  process.env.CLIENT_ID || null,
  process.env.TOKEN || null,
];

const commandFiles = fs
  .readdirSync(path.join(".", "commands"))
  .filter((file) => file.endsWith(".js"));
const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.toJSON());
}
const rest = new REST({ version: "9" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
