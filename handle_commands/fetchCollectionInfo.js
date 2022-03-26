const axios = require("axios");
const Qs = require("qs");
const rax = require("retry-axios");
const mongoClient = require("../db");

const displayData = require("./utils/displayData.js");

const raxConfig = {
  retry: 5,
  retryDelay: 5000,
  backoffType: "static",
};
const headers = {
  "X-API-KEY": process.env.apiKey,
};

const getNumberOfItemsAndContractAddress = async (enteredCollection) => {
  const collectionEndpoint = `https://api.opensea.io/api/v1/collection/${enteredCollection}`;
  const result = await axios.get(collectionEndpoint, {
    raxConfig,
    headers,
  });
  if (result.status === 404) {
    return {
      numberOfItems: null,
      contractAddress: null,
    };
  }
  return {
    numberOfItems: result.data.collection.stats.total_supply,
    contractAddress: result.data.collection.primary_asset_contracts[0].address,
  };
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
    raxConfig,
    headers,
    params,
  });
  return {
    assetsData: response.data.assets,
    nextCursor: response.data.next,
  };
};

module.exports = async (interaction) => {
  const enteredCollection = interaction.options.getString("collection-name");
  await interaction.deferReply();
  try {
    const { numberOfItems, contractAddress } =
      await getNumberOfItemsAndContractAddress(enteredCollection);
    if (!numberOfItems) {
      return await interaction.editReply(
        `Collection doesn't exist or has no items`
      );
    }
    interaction.editReply(
      `Fetching data from ${enteredCollection}. Please wait, this could take a long time.`
    );
    let assets = {};
    const params = {
      collection: enteredCollection,
      limit: 50,
    };
    let cursor = null;
    do {
      const { assetsData, nextCursor } = await fetchAssets(cursor, params);
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
    } while (cursor !== null);
    mongoClient.connect(async (err) => {
      if (err) return console.log(err);
      const collection = mongoClient
        .db("NFT-Database")
        .collection("NFT Collections");
      const timestamp = Date.now();
      await collection.replaceOne(
        {
          collection: enteredCollection,
        },
        {
          collection: enteredCollection,
          contractAddress,
          timestamp: Date.now(),
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
      assets = null;
      displayData(interaction, prices, timestamp);
    });
  } catch (e) {
    console.log(e);
    console.log(e.response);
    if (e.message !== undefined) {
      console.log(e.message);
      interaction.followUp(e.message);
    } else interaction.followUp("An error occured");
  }
};
