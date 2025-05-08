import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    id: v.string(),
    text: v.string(),
    title: v.string(),
  })
    .searchIndex("search_text", { searchField: "text" })
    .searchIndex("title_text", { searchField: "title" }),
});
