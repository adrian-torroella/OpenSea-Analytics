const convertPrice = require("./convertPrice");

module.exports = (orders) => {
  if (orders.orders.length === 0) return null;
  const payment_token_contract = orders.orders[0].payment_token_contract;
  const price = orders.orders[0].current_price;
  return convertPrice(price, payment_token_contract);
};
