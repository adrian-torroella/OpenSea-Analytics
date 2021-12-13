module.exports = assets => {
    const highestOffers= [];
    for(const tokenId in assets){
        highestOffers.push(assets[tokenId].highestOffer);
    }
    return {
        min: Math.min(...highestOffers),
        max: Math.max(...highestOffers),
        mean: highestOffers.reduce((el, acc) => el + acc, 0) / highestOffers.length,
    }
}
