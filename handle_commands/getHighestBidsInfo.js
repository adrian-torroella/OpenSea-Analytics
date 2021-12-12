const getHighestOffer = require('./utils/getHighestOffer');

module.exports = (interaction) => {
    const enteredCollection = interaction.options.getString('collection-name');
    const traitsString = interaction.options.getString('traits');

    await interaction.deferReply();
    await interaction.editReply(`Searching for ${enteredCollection}`);
    try{
        const requiredTraits = parseTraitsString(traitsString);
        let assets = undefined;
        let contractAddress = undefined;
        let collectionName = undefined;
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
            let returnedCollection = await collection.findOne({
                collection: enteredCollection,
            });
            mongoClient.close();
            if(returnedCollection === null)
                return interaction.followUp(`${enteredCollection} is not found, try using /fetchcollectioninfo`);
            assets = returnedCollection.assets;
            contractAddress = returnedCollection.contractAddress;
            collectionName = returnedCollection.collection;
        });
        if(!assets)
            return;
        if(!assets[Object.keys(assets[0])].highestBid){
            console.log('LOL');
            // Display Data
        }
        else{
            // Fetch 
            const axios = require('axios');
            const rax = require('retry-axios');
            rax.attach();

            const ordersEnpoint = `https://api.opensea.io/wyvern/v1/orders`;
            const raxConfig = {
                retry: 5,
                retryDelay: 5000,
                backoffType: 'static',
            };
            
            const tokenIds = Object.keys(assets);
            for(let i = 0; i < tokenIds.length; i += 5){
                const tokenIdsSlice = tokenIds.slice(i, i + 5 + 1); 
                const requests = tokenIdsSlice.map(tokenId => axios.get(ordersEnpoint, {
                    raxConfig,
                    params: {
                        asset_contract_address: contractAddress,
                        token_id: tokenId,
                        side: 0,
                        limit: 1,
                        offset: 0,
                        order_by: 'eth_price',
                        order_direction: 'desc',
                    }
                }));
                const responses = await Promise.all(requests);
                for(const [index, response] of Object.entries(responses)){
                    assets[tokenIds[i + index]].highestBid = getHighestOffer(response.data);
                }
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
    }
    catch(e){
        console.log(e);
        if(e.message !== undefined){
            console.log(e.message);
            interaction.editReply(e.message);
        }
        else
            interaction.editReply('An error occured');
    }
}
