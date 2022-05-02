const mongoClient = require("../db");

module.exports = writeCollectionInfoToDB = ({
  collectionName,
  contractAddress,
  assets,
}) => {
  mongoClient.connect(async (err) => {
    if (err) throw err;
    const collection = mongoClient
      .db("NFT-Database")
      .collection("NFT Collections");
    const timestamp = Date.now();
    await collection.replaceOne(
      {
        collection: collectionName,
      },
      {
        collection: collectionName,
        contractAddress,
        timestamp,
        assets,
      },
      {
        upsert: true,
      }
    );
    mongoClient.close();
  });
};
