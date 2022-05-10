const mongoClient = require("../db");

const getSlicedObject = (obj, keys) => {
  const slicedObject = {};
  for (const key of keys) {
    if (key in obj) {
      slicedObject[key] = obj[key];
    }
  }
  return slicedObject;
};

const chunkifyAssets = (assets, length) => {
  const chunks = [];
  const tokenIds = Object.keys(assets);
  for (let i = 0; i < tokenIds.length; i += length) {
    chunks.push(getSlicedObject(assets, tokenIds.slice(i, i + length)));
  }
  return chunks;
};

module.exports = writeCollectionInfoToDB = async ({
  collectionName,
  contractAddress,
  assets,
}) => {
  if (Object.keys(assets).length < 5e4) {
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
  } else {
    const assetsChunks = chunkifyAssets(assets, 5e4);
    const numberOfChunks = assetsChunks.length;
    const timestamp = Date.now();
    for (const [index, assetChunk] of Object.entries(assetsChunks)) {
      mongoClient.connect(async (err) => {
        if (err) throw err;
        const collection = mongoClient
          .db("NFT-Database")
          .collection("NFT Collections");
        await collection.replaceOne(
          {
            collection: collectionName,
            index,
          },
          {
            collection: collectionName,
            contractAddress,
            timestamp,
            assets: assetChunk,
            isChunked: true,
            index,
            numberOfChunks,
          },
          {
            upsert: true,
          }
        );
      });
    }
    mongoClient.close();
  }
};
