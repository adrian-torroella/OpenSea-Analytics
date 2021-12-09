const { MessageEmbed } = require('discord.js');
const mongoClient = require('../db');
const getThreeSmallestItems = require('./utils/getThreeSmallestItems');
const parseTraitsString = require('./utils/parseTraitsString');

const generateEmbedFeilds = (lowestPrices, isPair) => {
    const fields = [];
    for(const trait in lowestPrices){
        if(isPair){
            fields.push({
                name: `${trait.split(':')[0][0].toUpperCase()}${trait.split(':')[0].slice(1)} : ${trait.split(':')[1][0].toUpperCase()}${trait.split(':')[1].slice(1)}`,
                value: '============================',
            });
        }
        else{
            fields.push({
                name: `${trait[0].toUpperCase()}${trait.slice(1)}`,
                value: '============================',
            });
        }
        for(let i = 0; i < 3; i++){
            fields.push({
                name: `Token Id: ${lowestPrices[trait][i].split(':')[0]}`,
                value: `Price: ${lowestPrices[trait][i].split(':')[1]} ETH`,
            });
        }
        fields.push({
            name: '\u200B',
            value: '\u200B',
        });
    }
    fields.pop();
    return fields;
}

const displayPricesEmbed = (lowestPrices, isPair) => {
    return new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Lowest three listed prices')
        .setTimestamp(new Date())
        .addFields(...generateEmbedFeilds(lowestPrices, isPair))
};

module.exports = async interaction => {
    const enteredCollection = interaction.options.getString('collection-name');
    const traitsString = interaction.options.getString('traits');

    await interaction.deferReply();
    await interaction.editReply(`Searching for ${enteredCollection}`)
    try{
        mongoClient.connect(async e => {
            if(e){
                console.log(e);
                if(e.message !== undefined){
                    console.log(e.message);
                    interaction.followUp(e.message);
                }
                else
                    interaction.followUp('An error occured');
                return;
            }
            const collection = mongoClient.db('NFT-Database').collection('NFT Collections');
            const returnedCollection = await collection.findOne({
                collection: enteredCollection,
            });
            mongoClient.close();
            if(returnedCollection === null)
                return interaction.followUp(`${enteredCollection} is not found, try using /fetchcollectioninfo`);
            interaction.followUp(`Getting lowest prices, please wait.`);
            const requiredTraits = parseTraitsString(traitsString);
            const lowestThreePrices = {};
            const isPair = requiredTraits.pairs;
            for(const requiredTraitIndex in requiredTraits){
                if(requiredTraitIndex === 'pairs')
                    continue;
                if(isPair){
                    for(const requiredTrait of requiredTraits[requiredTraitIndex]){
                        lowestThreePrices[`${requiredTraitIndex}:${requiredTrait}`] = getThreeSmallestItems(returnedCollection.prices, returnedCollection.traits, requiredTraitIndex, requiredTrait, isPair);
                    }
                }
                else
                    lowestThreePrices[requiredTraitIndex] = getThreeSmallestItems(returnedCollection.prices, returnedCollection.traits, requiredTraitIndex, requiredTraits[requiredTraitIndex], isPair);
            }
            interaction.followUp({
                content: ' ',
                embeds: [displayPricesEmbed(lowestThreePrices, isPair)],
            });
        });   
    }
    catch(e){
        console.log(e);
        if(e.message !== undefined){
            console.log(e.message);
            interaction.editReply(e.message);
        }
        else
            interaction.editReply('An error occured');
    }
}
