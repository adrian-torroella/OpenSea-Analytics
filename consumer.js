const Queue = require("bull");
const axios = require("axios");
const mongoClient = require("./db");
const displayData = require("./handle_commands/utils/displayData.js");
const discordClient = require("./client");

const headers = {
  "X-API-KEY": process.env.apiKey,
};

const getLatestSalePrice = (asset) => {
  if (asset.sell_orders === null) return null;
  if (asset.last_sale !== null) {
    lastBuyDate = new Date(asset.last_sale.created_date);
    lastSaleDate = new Date(asset.sell_orders[0].created_date);
    if (lastBuyDate > lastSaleDate) return null;
  }
  if (asset.sell_orders[0].maker_relayer_fee === "0") return null;
  return {
    price: parseFloat(asset.sell_orders[0].current_price),
    ethPriceConversion: asset.sell_orders[0].payment_token_contract.eth_price,
    decimals: asset.sell_orders[0].payment_token_contract.decimals,
  };
};

const fetchAssets = async (cursor, paramsWithoutCursor) => {
  const assetsEndpoint = "https://api.opensea.io/api/v1/assets";
  let params = {
    ...paramsWithoutCursor,
  };
  if (cursor) {
    params = {
      ...params,
      cursor,
    };
  }
  const response = await axios.get(assetsEndpoint, {
    headers,
    params,
    timeout: 15000,
  });
  return {
    assetsData: response.data.assets,
    nextCursor: response.data.next,
  };
};

const consumerFunction = async (job) => {
  const {
    assets,
    currentCursor,
    collectionName,
    contractAddress,
    channelId,
    interactionOptions,
  } = job.data;
  let { begun } = job.data;
  let cursor = currentCursor;
  const params = {
    collection: collectionName,
    limit: 50,
    include_orders: "true",
  };
  try {
    while (cursor !== null || begun === false) {
      const { assetsData, nextCursor } = await fetchAssets(cursor, params);
      if (!begun) {
        begun = true;
      }
      cursor = nextCursor;
      for (const asset of assetsData) {
        const assetTraits = asset.traits;
        assets[asset.token_id.toString()] = {
          traits: {},
        };
        for (const trait of assetTraits) {
          assets[asset.token_id.toString()].traits[
            trait.trait_type.toString().toLowerCase()
          ] = trait.value.toString().toLowerCase();
        }
        const priceResults = getLatestSalePrice(asset);
        if (priceResults === null) continue;
        const { price, ethPriceConversion, decimals } = priceResults;
        const ethPrice = (price * ethPriceConversion) / Math.pow(10, decimals);
        assets[asset.token_id].price = ethPrice;
      }
      console.log(Object.keys(assets).length);
    }
  } catch (e) {
    console.log(e);
    if (e.isAxiosError) {
      console.log("Rescheduling");
      setTimeout(() => {
        fetchQueue.add({
          ...job.data,
          currentCursor: cursor,
          begun,
        });
      }, 60 * 1000);
    }
    return;
  }
  mongoClient.connect(async (err) => {
    if (err) return console.log(err);
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
    const prices = {};
    for (const tokenId in assets) {
      if (assets[tokenId].price) prices[tokenId] = assets[tokenId].price;
    }
    displayData(
      discordClient,
      channelId,
      collectionName,
      prices,
      timestamp,
      interactionOptions
    );
  });
};

const redisURL = "redis://redis:6379";

const fetchQueue = new Queue("fetch-queue", redisURL);
fetchQueue.process((job) => {
  consumerFunction(job);
});

module.exports = fetchQueue;
