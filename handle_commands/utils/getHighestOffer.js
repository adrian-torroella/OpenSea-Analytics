module.exports = (orders) => {
    const payment_token_address = orders.orders[0].payment_token_address;
    const { decimals, eth_price: ethPriceConverstion, } = payment_token_address;
    const price = orders.orders[0].current_price;
    return price * ethPriceConverstion / Math.pow(10, decimals);
}
