const { MessageEmbed } = require("discord.js");

const min = (prices) => Math.min(...Object.values(prices));

const inRange = (num, range) => num >= range[0] && num < range[1];

const constructEmbed = ({
  collection,
  timestamp,
  ranges,
  counts,
  nonDefaultMin,
}) => {
  const rangesStrings = ranges.map(
    (range) => `${range[0].toFixed(4)} - ${range[1].toFixed(4)} ETH`
  );
  const fields = rangesStrings.map((rangeString, index) => [
    rangeString,
    `${counts[index]}`,
  ]);
  let embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(collection)
    .setURL(`https://opensea.io/collection/${collection}`)
    .setTimestamp(new Date(timestamp));
  if (nonDefaultMin)
    embed = embed.addField(
      `${ranges[0][0].toFixed(4)} ETH-`,
      `${counts[counts.length - 1]}`
    );
  for (const field of fields) {
    embed = embed.addField(...field);
  }
  if (nonDefaultMin) {
    embed = embed.addField(
      `${ranges[ranges.length - 1][1].toFixed(4)} ETH+`,
      `${counts[counts.length - 2]}`
    );
  } else {
    embed = embed.addField(
      `${ranges[ranges.length - 1][1].toFixed(4)} ETH+`,
      `${counts[counts.length - 1]}`
    );
  }
  return embed;
};

module.exports = async (
  client,
  channelId,
  collection,
  prices,
  timestamp,
  { start: passedStart, step, numberOfSteps }
) => {
  const ranges = [];
  const nonDefaultMin = passedStart !== null;
  const start = !nonDefaultMin ? min(prices) : passedStart;
  let channel;
  try {
    channel = await client.channels.fetch(channelId);
  } catch (e) {
    console.log(e);
    return;
  }
  if (start < 0 || numberOfSteps <= 0 || step <= 0)
    return channel.send("Please enter valid numbers");
  let i = start;
  let count = 0;
  while (count < numberOfSteps) {
    ranges.push([i, i + step]);
    count++;
    i += step;
  }
  const counts = new Array(ranges.length + 1).fill(0);
  for (const item in prices) {
    let flag = true;
    for (let i = 0; i < numberOfSteps; i++) {
      if (inRange(prices[item], ranges[i])) {
        counts[i]++;
        flag = false;
        break;
      }
    }
    if (flag && prices[item] >= ranges[ranges.length - 1][1])
      counts[numberOfSteps]++;
  }
  if (nonDefaultMin) {
    const sum = counts.reduce((a, b) => a + b, 0);
    counts.push(Object.keys(prices).length - sum);
  }

  channel.send({
    content: " ",
    embeds: [
      constructEmbed({ collection, timestamp, ranges, counts, nonDefaultMin }),
    ],
  });
};
