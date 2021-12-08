const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = new SlashCommandBuilder()
    .setName('get-lowest-listed-price')
    .setDescription('Show price of cheapest assets containing certain traits')
	.addStringOption(option => option.setName('collection-name')
        .setDescription('Enter a collection name')
        .setRequired(true)
    ).addStringOption(option => option.setName('traits')
        .setDescription('Enter the desired traits seperated by semicolons')
        .setRequired(true)
    )
