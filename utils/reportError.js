const discordClient = require("./client");

const reportError = async (channelId, errorMessage) => {
  try {
    const channel = await discordClient.channels.fetch(channelId);
    channel.send(errorMessage);
  } catch (err) {
    console.log(err);
  }
};
