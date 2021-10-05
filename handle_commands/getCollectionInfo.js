const displayData = require('./utils/displayData.js');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Loves_Computer:43lFPT2Z5vDISZ3W@fc-cluster-0.9bdrd.mongodb.net/NFT-Collection?retryWrites=true&w=majority";

module.exports = async interaction => {      
    const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const enteredCollection = interaction.options.getString('collection-name');
    await interaction.deferReply();
    await interaction.editReply(`Getting data from ${enteredCollection}. Please wait`);
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
            displayData(interaction, returnedCollection.prices, returnedCollection.timestamp);
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