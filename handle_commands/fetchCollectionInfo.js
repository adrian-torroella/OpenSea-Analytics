const axios = require('axios');
const Qs = require('qs');
const rax = require('retry-axios');
const displayData = require('./utils/displayData.js')
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Loves_Computer:43lFPT2Z5vDISZ3W@fc-cluster-0.9bdrd.mongodb.net/NFT-Collection?retryWrites=true&w=majority";
const raxConfig = {
    retry: 5,
    retryDelay: 5000,
    backoffType: 'static',
};

const collectionNameExists = async enteredCollection => {
    const assetsEndpoint = 'https://api.opensea.io/api/v1/assets';
    const result = await axios.get(assetsEndpoint,{
        raxConfig,
        params:{
            collection: enteredCollection,
            limit: 1,
        },
        headers: {
            'X-API-KEY': process.env.apiKey || null,
        },
    });
    if (result.data.assets.length === 0){
        return {
            exists: false
        };
    }
    return {
        exists: true,
        address: result.data.assets[0].asset_contract.address,
        tokenId: result.data.assets[0].token_id,
    };   
}

const getNumberOfItems = async (address, tokenId) => {
    const assetEndpoint = `https://api.opensea.io/api/v1/asset/${address}/${tokenId}`;
    const result = await axios.get(assetEndpoint,{
        raxConfig,
        headers: {
            'X-API-KEY': process.env.apiKey || null,
        },
    });
    return result.data.collection.stats.total_supply;
}

const getContractAddress = async enteredCollection => {
    const assetsEndpoint = 'https://api.opensea.io/api/v1/assets';
    const response = await axios.get(assetsEndpoint, {
        raxConfig,
        params: {
            collection: enteredCollection,
            offset: 0,
            limit: 1,
        },
        headers: {
            'X-API-KEY': process.env.apiKey || null,
        },
    });
    return response.data.assets[0].asset_contract.address;
};

const getLatestSalePrice = asset =>{
    if (asset.sell_orders === null)
        return null;
    if(asset.last_sale !== null){
        lastBuyDate = new Date(asset.last_sale.created_date);
        lastSaleDate = new Date(asset.sell_orders[0].created_date);
        if (lastBuyDate > lastSaleDate)
            return null;
    }
    if(asset.sell_orders[0].maker_relayer_fee === '0')
        return null;
    return {
        price: parseFloat(asset.sell_orders[0].current_price),
        ethPriceConversion: asset.sell_orders[0].payment_token_contract.eth_price,
        decimals: asset.sell_orders[0].payment_token_contract.decimals,
    };
};

module.exports = async interaction => {      
    const enteredCollection = interaction.options.getString('collection-name');
    await interaction.deferReply();
    try{
        const result = await collectionNameExists(enteredCollection);
        if (!result.exists)
            return await interaction.editReply(`Collection doesn't exist or has no items`);
        interaction.editReply(`Fetching data from ${enteredCollection}. Please wait, this could take a long time`);
        const numberOfItems = await getNumberOfItems(result.address, result.tokenId);
        const assetsEndpoint = 'https://api.opensea.io/api/v1/assets';
        const prices = [];
        const traits = {};
        rax.attach();
        if (numberOfItems <= 1e4 + 50){
            let offset = 0;
            const params = {
                collection: enteredCollection,
                limit: 50,
            };
            while(offset <= 1e4){
                const requests = [];
                if (offset === 1e4){
                    requests.push(axios.get(assetsEndpoint, {
                        raxConfig,
                        params: {
                            ...params,
                            offset,
                        },
                        headers: {
                            'X-API-KEY': process.env.apiKey || null,
                        },
                    }));
                }
                else{
                    for(let i = offset; i < offset + 500; i += 50){
                        requests.push(axios.get(assetsEndpoint, {
                            raxConfig,
                            params: {
                                ...params,
                                offset: i
                            },
                            headers: {
                                'X-API-KEY': process.env.apiKey || null,
                            },
                        }));
                    }
                }
                const responses = await Promise.all(requests);
                if(responses.every(response => response.data.assets.length === 0))
                    break;
                for(const response of responses){
                    if(response.data.assets.length === 0)
                        continue;
                    for(const asset of response.data.assets){
                        const assetTraits = asset.traits;
                        traits[asset.token_id.toString()] = {};
                        for(const trait of assetTraits){
                            traits[asset.token_id.toString()][trait.trait_type.toLowerCase()] = trait.value.toLowerCase();
                        }
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null)
                            continue;
                        const { price, ethPriceConversion, decimals } = priceResults;
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        prices.push(ethPrice);    
                        
                    }
                }
                offset += 10 * 50;
                console.log(offset);
            }
        }
        else if (numberOfItems <= 2e4 + 100){
            let countItems = 0;
            let offset = 0;
            let params = {
                collection: enteredCollection,
                order_direction: 'asc',
                limit: 50,
            };
            while(offset <= 1e4){
                const requests = [];
                if (offset === 1e4){
                    requests.push(axios.get(assetsEndpoint, {
                        raxConfig,
                        params: {
                            ...params,
                            offset,
                        },
                        headers: {
                            'X-API-KEY': process.env.apiKey || null,
                        },
                    }));
                }
                else{
                    for(let i = offset; i < offset + 500; i += 50){
                        requests.push(axios.get(assetsEndpoint, {
                            raxConfig,
                            params: {
                                ...params,
                                offset: i
                            },
                            headers: {
                                'X-API-KEY': process.env.apiKey || null,
                            },
                        }));
                    }
                }
                const responses = await Promise.all(requests);
                for(const response of responses){
                    countItems += response.data.assets.length;
                    if(response.data.assets.length === 0)
                        continue;
                    for(const asset of response.data.assets) {
                        const assetTraits = asset.traits;
                        traits[asset.token_id.toString()] = {};
                        for(const trait of assetTraits) {
                            traits[asset.token_id.toString()][trait.trait_type.toLowerCase()] = trait.value.toLowerCase();
                        }   
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null)
                            continue;
                        const { price, ethPriceConversion, decimals } = priceResults;
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        prices.push(ethPrice);
                    }
                }
                offset += 10 * 50;
                console.log(offset, countItems);
            }
            offset = 0;
            params = {
                collection: enteredCollection,
                order_direction: 'desc',
                limit: 50,
            };
            while(offset <= 1e4){
                const requests = [];
                if (offset === 1e4){
                    requests.push(axios.get(assetsEndpoint, {
                        raxConfig,
                        params: {
                            ...params,
                            offset,
                        },
                        headers: {
                            'X-API-KEY': process.env.apiKey || null,
                        },
                    }));
                }
                else{
                    for(let i = offset; i < offset + 500; i += 50){
                        requests.push(axios.get(assetsEndpoint, {
                            raxConfig,
                            params: {
                                ...params,
                                offset: i
                            },
                            headers: {
                                'X-API-KEY': process.env.apiKey || null,
                            },
                        }));
                    }
                }
                const responses = await Promise.all(requests);
                let breakFromWhile = false;
                for(const response of responses){
                    if(breakFromWhile){
                        break;
                    }
                    countItems += response.data.assets.length;
                    if(countItems >= numberOfItems){
                        breakFromWhile = true;
                        countItems -= response.data.assets.length;
                    }
                    if(response.data.assets.length === 0)
                        continue;
                    for(const asset of response.data.assets) {
                        const assetTraits = asset.traits;
                        traits[asset.token_id.toString()] = {};
                        for(const trait of assetTraits){
                            traits[asset.token_id.toString()][trait.trait_type.toLowerCase()] = trait.value.toLowerCase();
                        }
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null){
                            if(breakFromWhile){
                                countItems++;
                            }
                            if(countItems === numberOfItems){
                                break;
                            }
                            continue;
                        }
                        const { price, ethPriceConversion, decimals } = priceResults;                        
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        prices.push(ethPrice);
                        if(breakFromWhile){
                            countItems++;
                        }
                        if(countItems === numberOfItems){
                            break;
                        }
                    }
                }
                if(breakFromWhile){
                    break;
                }
                offset += 10 * 50;
                console.log(offset, countItems);
            }
        }
        else{
            const arrAxios = axios.create({
                paramsSerializer: params => Qs.stringify(params, {arrayFormat: 'repeat'})
            })
            arrAxios.defaults.raxConfig = {
                ...raxConfig,
                instance: arrAxios,
            };
            rax.attach(arrAxios);
            const contractAddress = await getContractAddress(enteredCollection);
            const params = {
                asset_contract_address: contractAddress,
                limit: 30,
            };
            let countItems = 0;
            let currentTokenId = 0;
            while(countItems < numberOfItems){
                const tokenIds = [];
                for(let i = currentTokenId; i < currentTokenId + 300; i += 30){
                    const tokenIdRange = [];
                    for(let j = i; j < i + 30; j++)
                        tokenIdRange.push(j);
                    tokenIds.push(tokenIdRange);
                }
                const requests = tokenIds.map(tokenIdRange => {
                    return arrAxios.get(assetsEndpoint, {
                        params:{
                            ...params,
                            token_ids: tokenIdRange,
                        },
                        headers: {
                            'X-API-KEY': process.env.apiKey || null,
                        },
                    });
                });
                const responses = await Promise.all(requests);
                for(const response of responses){
                    countItems += response.data.assets.length;
                    if(response.data.assets.length === 0)
                        continue;
                    for(const asset of response.data.assets){
                        const assetTraits = asset.traits;
                        traits[asset.token_id.toString()] = {};
                        for(const trait of assetTraits){
                            traits[asset.token_id.toString()][trait.trait_type.toLowerCase()] = trait.value.toLowerCase();
                        }
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null)
                            continue;
                        const { price, ethPriceConversion, decimals } = priceResults;
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        prices.push(ethPrice);
                    }
                }
                currentTokenId += 10 * 30;
                console.log(currentTokenId);
            }
        }
        const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        mongoClient.connect(async err => {
            if(err)
                return console.log(err);
            const collection = mongoClient.db('NFT-Database').collection('NFT Collections');
            const timestamp = Date.now();
            await collection.replaceOne({
                collection: enteredCollection,
            }, {
                collection: enteredCollection,
                timestamp: Date.now(),    
                prices,
                traits,
            }, {
                upsert: true,
            });
            mongoClient.close();
            displayData(interaction, prices, timestamp);
        });
    }
    catch(e){
        console.log(e);
        console.log(e.response)
        if (e.message !== undefined){    
            console.log(e.message);
            interaction.followUp(e.message);
        }
        else
            interaction.followUp('An error occured')
    }
};
