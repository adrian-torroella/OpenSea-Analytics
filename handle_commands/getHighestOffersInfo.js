const { MessageEmbed } = require('discord.js');
const mongoClient = require('../db');

const parseTraitsString = require('./utils/parseTraitsString');
const getSingleHighestOffer = require('./utils/getSingleHighestOffer');
const getHighestOffers = require('./utils/getHighestOffers');
const getMinMaxMedian = require('./utils/getMinMaxMedian');

const filterRequiredTraits = (assets, requiredTraitIndex, requiredTraitValue, isPair) => {
    if(isPair)
        return Object.filter(assets, ({ traits, ...rest }) => Object.keys(traits).includes(requiredTraitIndex) && traits[requiredTraitIndex].includes(requiredTraitValue));
    return Object.filter(assets, ({ traits, ...rest }) => Object.values(traits).includes(requiredTraitIndex));
};

const displayMinMaxMedianEmbed = (min, max, median, requiredTraitIndex, requiredTraitValue) => {
    return new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Min, Max and Median for ${requiredTraitValue ? `${requiredTraitIndex} : ${requiredTraitValue}` : `${requiredTraitIndex}`}`)
        .setTimestamp(new Date())
        .addFields(
            {
                name: 'Min',
                value: min.toString(),
            },
            {
                name: 'Max',
                value: max.toString(),
            },
            {
                name: 'Median',
                value: median.toString(),
            },
        );
}

const fetchAndSendHighestOfferInfoForTrait = async (interaction, assets, contractAddress, collectionName, forceFetch, requiredTraitIndex, requiredTraitValue, isPair) => {
    const enteredCollection = interaction.options.getString('collection-name');
    
    const filteredAssets = filterRequiredTraits(assets, requiredTraitIndex, requiredTraitValue, isPair);

    if(Object.keys(filteredAssets).length === 0){
        interaction.followUp(`Trait ${requiredTraitValue ? `${requiredTraitIndex} : ${requiredTraitValue}` : `${requiredTraitIndex}`} doesn't exist`);
        return;
    }

    if(forceFetch || !Object.keys(filteredAssets).every(tokenId => filteredAssets[tokenId].hasOwnProperty('highestOffer'))){
        // Fetch
        interaction.followUp(`Fetching information about offers for ${enteredCollection} with trait ${requiredTraitValue ? `${requiredTraitIndex} : ${requiredTraitValue}` : `${requiredTraitIndex}`}, please waiat as this can take a long time`);

        const axios = require('axios');
        const Qs = require('qs');
        const rax = require('retry-axios');

        const arrAxios = axios.create({
            paramsSerializer: params => Qs.stringify(params, {arrayFormat: 'repeat'})
        })

        const raxConfig = {
            retry: 5,
            retryDelay: 5000,
            backoffType: 'static',
        };

        arrAxios.defaults.raxConfig = {
            ...raxConfig,
            instance: arrAxios,
        };

        rax.attach(arrAxios);

        const ordersEnpoint = `https://api.opensea.io/wyvern/v1/orders`;
        
        const tokenIds = Object.keys(filteredAssets);
        for(let i = 0; i < tokenIds.length; i += 5 * 10){
            const requests = [];
            const tokenIdsSlice = tokenIds.slice(i, i + 5 * 10 + 1);
            if(tokenIdsSlice.length === 0)
                continue;
            const tokenIdsMinorSlices = [];
            for(let j = 0; j < 5; j++){
                const tokenIdsMinorSlice = tokenIdsSlice.slice(j * 10, j * 10 + 10);
                if(tokenIdsMinorSlice.length === 0)
                    continue;
                tokenIdsMinorSlices.push(tokenIdsMinorSlice);
                console.log(`Getting orders for ${tokenIdsMinorSlice}`);
                requests.push(arrAxios.get(ordersEnpoint, {
                    raxConfig,
                    params: {
                        asset_contract_address: contractAddress,
                        taker: '0x0000000000000000000000000000000000000000',
                        token_ids: tokenIdsMinorSlice,
                        side: 0,
                        limit: 50,
                        offset: 0,
                        order_by: 'eth_price',
                        order_direction: 'desc',
                        include_bundled: false,
                        bundled: false,
                    },
                    headers: {
                        'X-API-KEY': process.env.apiKey || undefined,
                    }
                }));
            }
            const responses = (await Promise.all(requests)).map(response => response.data);
            for(const [index, response] of Object.entries(responses)){
                const highestOfferFound = getHighestOffers(filteredAssets, response, tokenIdsMinorSlices[parseInt(index)]);
                const tokenIdsWithNoOffersFound = Object.keys(highestOfferFound).filter(tokenId => !highestOfferFound[tokenId]);
                const extraRequests = [];
                for(const tokenId of tokenIdsWithNoOffersFound){
                    extraRequests.push(arrAxios.get(ordersEnpoint, {
                        raxConfig,
                        params: {
                            asset_contract_address: contractAddress,
                            taker: '0x0000000000000000000000000000000000000000',
                            token_id: tokenId,
                            side: 0,
                            limit: 1,
                            offset: 0,
                            order_by: 'eth_price',
                            order_direction: 'desc',
                            include_bundled: false,
                            bundled: false,
                        },
                        headers: {
                            'X-API-KEY': process.env.apiKey || undefined,
                        }
                    }));
                }
                if(extraRequests.length > 0){
                    console.log(`Didn't find offers for ${tokenIdsWithNoOffersFound}`);
                    console.log(`Trying to find them`);
                    const extraResponses = await Promise.all(extraRequests);
                    console.log(`Found missing orders`);
                    for(const [index, response] of Object.entries(extraResponses)){
                        filteredAssets[tokenIdsWithNoOffersFound[parseInt(index)]].highestOffer = getSingleHighestOffer(response.data);
                    }
                }
            }
        }

        console.log(`Finished Fetching`);

        for(const tokenId in filteredAssets){
            assets[tokenId].highestOffer = filteredAssets[tokenId].highestOffer;
        }
        
        mongoClient.connect(async e => {
            if(e){
                console.log(e);
                if(e.message !== undefined){
                    console.log(e.message);
                    interaction.followUp(e.message);
                }
                else
                    interaction.followUp('An error occured');
                return;
            }
            const collection = mongoClient.db('NFT-Database').collection('NFT Collections');
            await collection.replaceOne({
                collection: collectionName,
            }, {
                collection: collectionName,
                contractAddress,
                timestamp: Date.now(),    
                assets,
            }, {
                upsert: true,
            });
            mongoClient.close();
        });
    }

    const { min, max, median } = getMinMaxMedian(filteredAssets);
    interaction.channel.send({
        content: ' ',
        embeds: [displayMinMaxMedianEmbed(min, max, median, requiredTraitIndex, requiredTraitValue)],
    });
}

module.exports = async (interaction) => {
    const enteredCollection = interaction.options.getString('collection-name');
    const traitsString = interaction.options.getString('traits');
    const forceFetch = interaction.options.getBoolean('force-fetch');

    await interaction.deferReply();
    await interaction.editReply(`Searching for ${enteredCollection}`);
    try{
        const requiredTraits = parseTraitsString(traitsString);
        
        const isPair = requiredTraits.pairs;

        for(const requiredTraitIndex in requiredTraits){

            if(requiredTraitIndex === 'pairs')
                continue;

            let assets = undefined;
            let contractAddress = undefined;
            let collectionName = undefined;
            
            await mongoClient.connect();
            const collection = mongoClient.db('NFT-Database').collection('NFT Collections');
            let returnedCollection = await collection.findOne({
                collection: enteredCollection,
            });
            mongoClient.close();
            if(returnedCollection === null)
                return interaction.followUp(`${enteredCollection} is not found, try using /fetchcollectioninfo`);
            
            assets = {
                ...returnedCollection.assets,
            };

            contractAddress = returnedCollection.contractAddress;
            collectionName = returnedCollection.collection;
            returnedCollection = null;

            if(isPair){
                for(const requiredTraitValue of requiredTraits[requiredTraitIndex]){
                    await fetchAndSendHighestOfferInfoForTrait(interaction, assets, contractAddress, collectionName, forceFetch, requiredTraitIndex, requiredTraitValue, isPair);
                }
            }
            else{
                await fetchAndSendHighestOfferInfoForTrait(interaction, assets, contractAddress, collectionName, forceFetch, requiredTraitIndex, null, isPair);
            }
        }
    }
    catch(e){
        console.log(e);
        if(e.isAxiosError){
            console.log(e.response.data);
        }
        if(e.message !== undefined){
            console.log(e.message);
            interaction.editReply(e.message);
        }
        else
            interaction.editReply('An error occured');
    }
    finally{
        mongoClient.close();
    }
}
