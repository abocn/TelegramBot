function verifyInput(ctx, userInput, message, verifyNaN = false) {
    if (!userInput || (verifyNaN && isNaN(userInput))) {
        ctx.reply(message, {
            parse_mode: "Markdown",
            reply_to_message_id: ctx.message.message_id
        });
        return true;
    }
    return false;
}

module.exports = {
    verifyInput
};