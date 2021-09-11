const displayData = require('./utils/displaydata.js');
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Bugs_Bunny:lolgamer99@cluster0.uof7m.mongodb.net/test?retryWrites=true&w=majority";

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
            const collection = mongoClient.db('test').collection('test');
            const returnedCollection = await collection.findOne({
                collection: enteredCollection,
            });
            mongoClient.close();
            if(returnedCollection === null)
                return interaction.followUp(`${enteredCollection} is not found, try using /fetchcollectioninfo`);
            displayData(interaction, returnedCollection.data, returnedCollection.timestamp);
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