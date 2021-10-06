const path = require('path');
const fs= require('fs');
const { MongoClient } = require('mongodb');
const parseTraitsString = require('./utils/parseTraitsString');
const generateCSVFile = require('./utils/generateCSVFile');
const uri = "mongodb+srv://Loves_Computer:43lFPT2Z5vDISZ3W@fc-cluster-0.9bdrd.mongodb.net/NFT-Collection?retryWrites=true&w=majority";

module.exports = async interaction => {      
    const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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
            let returnedCollection = await collection.findOne({
                collection: enteredCollection,
            });
            mongoClient.close();
            if(returnedCollection === null)
                return interaction.followUp(`${enteredCollection} is not found, try using /fetchcollectioninfo`);
            interaction.followUp(`Generating CSV file for ${enteredCollection} with tratis ${traitsString}, please wait.`);
                const traits = {
                ...returnedCollection.traits,
            };
            returnedCollection = null;
            const requiredTraits = parseTraitsString(traitsString);
            const id = await generateCSVFile(enteredCollection, traits, requiredTraits);
            try{
                await fs.promises.access(path.join('.', `${enteredCollection}-${id}.csv`), fs.constants.F_OK);
                await interaction.followUp({
                    content: ' ',
                    files: [
                        path.join('.', `${enteredCollection}-${id}.csv`),
                    ],
                });
                fs.promises.rm(path.join('.', `${enteredCollection}-${id}.csv`));
            }
            catch {
                interaction.followUp('Trait(s) not found')
            }
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