import { Context } from "telegraf";
import { replyToMessageId } from "../utils/reply-to-message-id";

export default function verifyInput(ctx: Context, userInput: string, message: string, verifyNaN = false) {
    const reply_to_message_id = replyToMessageId(ctx);
    if (!userInput || (verifyNaN && isNaN(Number(userInput)))) {
        ctx.reply(message, {
            parse_mode: "Markdown",
            ...({ reply_to_message_id })
        });
        return true;
    }
    return false;
}
