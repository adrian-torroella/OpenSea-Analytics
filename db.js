const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Loves_Computer:43lFPT2Z5vDISZ3W@fc-cluster-0.9bdrd.mongodb.net/NFT-Collection?retryWrites=true&w=majority";

const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = mongoClient;
