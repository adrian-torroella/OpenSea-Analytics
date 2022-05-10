const mongoClient = require("../db");

module.exports = async (collectionName) => {
  let returnedCollections;
  await mongoClient.connect();
  const collection = mongoClient
    .db("NFT-Database")
    .collection("NFT Collections");
  returnedCollections = await collection
    .find({
      collection: collectionName,
    })
    .toArray();

  mongoClient.close();
  if (returnedCollections.length === 0) {
    return null;
  } else if (returnedCollections.length === 1) {
    return returnedCollections[0];
  } else {
    const { assets: _, ...rest } = returnedCollections[0];
    let returnedCollection = {
      ...rest,
    };
    const assetsChunks = returnedCollections.map(
      (returnedCollection) => returnedCollection.assets
    );
    for (const assetChunk of assetsChunks) {
      returnedCollection = {
        ...returnedCollection,
        assets: {
          ...returnedCollection.assets,
          ...assetChunk,
        },
      };
    }
    return returnedCollection;
  }
};
