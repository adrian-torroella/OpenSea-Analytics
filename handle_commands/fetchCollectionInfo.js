const axios = require('axios');
const Qs = require('qs');
const rax = require('retry-axios');
const mongoClient = require('../db');

const displayData = require('./utils/displayData.js')
const raxConfig = {
    retry: 5,
    retryDelay: 5000,
    backoffType: 'static',
};

const getNumberOfItems = async enteredCollection => {
    const collectionEndpoint = `https://api.opensea.io/api/v1/collection/${enteredCollection}`;
    const result = await axios.get(collectionEndpoint, {
        raxConfig,
        headers: {
            'X-API-KEY': process.env.apiKey || undefined,
        },
    });
    if (result.status === 404){
        return null;
    }
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
            'X-API-KEY': process.env.apiKey || undefined,
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
        const numberOfItems = await getNumberOfItems(enteredCollection);
        if (!numberOfItems)
            return await interaction.editReply(`Collection doesn't exist or has no items`);
        interaction.editReply(`Fetching data from ${enteredCollection}. Please wait, this could take a long time`);
        const assetsEndpoint = 'https://api.opensea.io/api/v1/assets';
        let assets = {};
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
                            'X-API-KEY': process.env.apiKey || undefined,
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
                                'X-API-KEY': process.env.apiKey || undefined,
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
                        assets[asset.token_id.toString()] = {
                            traits: {},
                        };
                        for(const trait of assetTraits){
                            assets[asset.token_id.toString()].traits[trait.trait_type.toString().toLowerCase()] = trait.value.toString().toLowerCase();
                        }
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null)
                            continue;
                        const { price, ethPriceConversion, decimals } = priceResults;
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        assets[asset.token_id].price = ethPrice;          
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
                            'X-API-KEY': process.env.apiKey || undefined,
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
                                'X-API-KEY': process.env.apiKey || undefined,
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
                        assets[asset.token_id.toString()] = {
                            traits: {},
                        };
                        for(const trait of assetTraits) {
                            assets[asset.token_id.toString()].traits[trait.trait_type.toString().toLowerCase()] = trait.value.toString().toLowerCase();
                        }   
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null)
                            continue;
                        const { price, ethPriceConversion, decimals } = priceResults;
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        assets[asset.token_id].price = ethPrice;          
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
                            'X-API-KEY': process.env.apiKey || undefined,
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
                                'X-API-KEY': process.env.apiKey || undefined,
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
                        assets[asset.token_id.toString()] = {
                            traits: {},
                        };
                        for(const trait of assetTraits){
                            assets[asset.token_id.toString()].traits[trait.trait_type.toString().toLowerCase()] = trait.value.toString().toLowerCase();
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
                        assets[asset.token_id].price = ethPrice;          
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
                            'X-API-KEY': process.env.apiKey || undefined,
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
                        assets[asset.token_id.toString()] = {
                            traits: {},
                        };
                        for(const trait of assetTraits){
                            assets[asset.token_id.toString()].traits[trait.trait_type.toString().toLowerCase()] = trait.value.toString().toLowerCase();
                        }
                        const priceResults = getLatestSalePrice(asset);
                        if(priceResults === null)
                            continue;
                        const { price, ethPriceConversion, decimals } = priceResults;
                        const ethPrice = price * ethPriceConversion / Math.pow(10, decimals);
                        assets[asset.token_id].price = ethPrice;          
                    }
                }
                currentTokenId += 10 * 30;
                console.log(currentTokenId);
            }
        }
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
                assets,
            }, {
                upsert: true,
            });
            mongoClient.close();
            const prices = {};
            for(const tokenId in assets){
                if(assets[tokenId].price)
                    prices[tokenId] = assets[tokenId].price;
            }
            assets = null;
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
