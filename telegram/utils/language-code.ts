import { Context } from "telegraf";

export const languageCode = (ctx: Context) => {
    if(ctx.from) {
        return ctx.from.language_code 
    } else {
        return 'en'
    }
}