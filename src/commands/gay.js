module.exports = function (bot, msg) {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  const userId = msg.from.id;
  let isGay = "";

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  };

  const randomValue = getRandomInt(2);

  if (randomValue === 0) {
    isGay = `You (${userName}) are not a gay.`;
  } else {
    isGay = `Yes, you (${userName}) are a gay.`;
  };

  const message = `${isGay}`;

  bot.sendMessage(chatId, message)
    .catch(error => console.error('ERROR: Message cannot be sent:', error));
  console.log(`INFO: /gay executed by ${userName}, ${userId}`)
}