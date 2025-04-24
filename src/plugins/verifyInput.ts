export default function verifyInput(ctx: any, userInput: string, message: string, verifyNaN = false) {
    if (!userInput || (verifyNaN && isNaN(Number(userInput)))) { // not sure why isNaN is used here, but the input should be a number
        ctx.reply(message, {
            parse_mode: "Markdown",
            reply_to_message_id: ctx.message.message_id
        });
        return true;
    }
    return false;
}
