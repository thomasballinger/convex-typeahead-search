import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query(async (ctx) => {
  return await ctx.db.query("messages").take(10);
});

export const search = query({
  args: { query: v.string(), maxResults: v.number() },
  handler: async (ctx, { query, maxResults }) => {
    const queryStreamTitle = ctx.db
      .query("messages")
      .withSearchIndex("title_text", (q) => q.search("title", query));

    const queryStreamContent = ctx.db
      .query("messages")
      .withSearchIndex("search_text", (q) => q.search("text", query));

    const results: any[] = [];

    console.time("search");
    for await (const result of queryStreamTitle) {
      results.push(result);
      if (results.length >= maxResults) {
        break;
      }
    }
    if (results.length < maxResults)
      for await (const result of queryStreamContent) {
        if (results.length >= maxResults) {
          break;
        }
        results.push(result);
        if (results.length >= maxResults) {
          break;
        }
      }
    console.timeEnd("search");
    return results;
  },
});

export const send = mutation({
  args: { body: v.string(), author: v.string() },
  handler: async (ctx, { body, author }) => {
    const message = { id: "", text: body, title: author };
    await ctx.db.insert("messages", message);
  },
});
