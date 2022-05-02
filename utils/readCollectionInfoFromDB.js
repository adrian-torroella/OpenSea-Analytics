const mongoClient = require("../db");

module.exports = async (collectionName) => {
  let returnedCollection;
  await mongoClient.connect();
  const collection = mongoClient
    .db("NFT-Database")
    .collection("NFT Collections");
  returnedCollection = await collection.findOne({
    collection: collectionName,
  });
  mongoClient.close();
  return returnedCollection;
};
