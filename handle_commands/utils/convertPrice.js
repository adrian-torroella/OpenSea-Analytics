module.exports = (price, payment_token_contract) => {
  const { decimals, eth_price: ethPriceConverstion } = payment_token_contract;
  return (price * ethPriceConverstion) / Math.pow(10, decimals);
};
