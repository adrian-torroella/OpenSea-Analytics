module.exports = (assets) => {
    const highestOffers = [];
    for(const tokenId in assets){
        if(assets[tokenId].highestOffer)
            highestOffers.push(assets[tokenId].highestOffer);
    }
    highestOffers.sort((a, b) => a - b);
    const n = highestOffers.length;
    return {
        min: highestOffers.at(0),
        max: highestOffers.at(-1),
        median: n % 2 == 0 ? (highestOffers[Math.floor(n / 2)] + highestOffers[Math.floor((n - 1) / 2)]) / 2.0 : highestOffers[Math.floor(n / 2)],
    }
}
