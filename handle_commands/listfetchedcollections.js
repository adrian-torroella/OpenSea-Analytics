const { MessageEmbed } = require('discord.js');
const { MongoClient } = require('mongodb');
const moment = require('moment');

const uri = "mongodb+srv://Loves_Computer:43lFPT2Z5vDISZ3W@fc-cluster-0.9bdrd.mongodb.net/NFT-Collection?retryWrites=true&w=majority";

const displayListOfDocuments = documents => {
    const fields = documents.map(document => ([
        document.collection,
        (moment(new Date(document.timestamp))).format("DD/M/YYYY  HH:mm"),
    ]));
    let embed = new MessageEmbed()
        .setTitle('Fetched Collections')
        .setColor('#0099ff')
        .setTimestamp()
    for(field of fields)
        embed = embed.addField(...field);
    return embed;
}

module.exports = async interaction => {
    await interaction.deferReply();
    const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoClient.connect(async e => {
        if(e){
            console.log(e);
            return interaction.editReply('An Error occured, try again later');
        }
        const collection = mongoClient.db('NFT-Database').collection('NFT Collections');
        const cursor = collection.find({});
        if (await cursor.count() === 0) {
            return interaction.editReply('No documents found!');
        }
        const documents = await cursor.toArray();
        interaction.editReply({
            content: ' ',
            embeds: [displayListOfDocuments(documents)]
        });       
    });
}
