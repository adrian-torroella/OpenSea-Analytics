const mongoClient = require('../db');
const getThreeSmallestItems = require('./utils/getThreeSmallestItems');
const parseTraitsString = require('./utils/parseTraitsString');

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
            for(const requiredTrait in requiredTraits){
                if(requiredTrait === 'pairs')
                    continue;
                lowestThreePrices[requiredTrait] = getThreeSmallestItems(returnedCollection.prices, returnedCollection.traits, requiredTrait);
            }
            interaction.followUp(JSON.stringify(lowestThreePrices));
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
