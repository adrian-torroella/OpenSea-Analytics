const convertPrice = require('./convertPrice');

module.exports = (assets, orders, tokenIdsMinorSlice) => {
    const highestOfferFound = {};
    for(const tokenId of tokenIdsMinorSlice){
        highestOfferFound[tokenId] = false;
    }
    for(const order of orders.orders){
        if(!highestOfferFound[order.asset.token_id]){
            assets[order.asset.token_id].highestOffer = convertPrice(order.current_price, order.payment_token_contract);
            highestOfferFound[order.asset.token_id] = true;
        }
    }
    if(orders.orders.length < 50){
        for(const tokenId of tokenIdsMinorSlice){
            if(!highestOfferFound[tokenId]){
                assets[tokenId].highestOffer = null;
                highestOfferFound[tokenId] = true;
            }
        }
    }
    return highestOfferFound;
}
