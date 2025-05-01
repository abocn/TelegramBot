import { Context } from "telegraf"

export const replyToMessageId = (ctx: Context) => {
    return ctx.message?.message_id
}