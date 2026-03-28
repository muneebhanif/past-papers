"use node";

import { randomBytes, createHmac } from "node:crypto";
import { action } from "./_generated/server";
import { requireUser } from "./lib";

export const getUploadAuth = action({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    const recentAuthRequests = await ctx.db
      .query("uploadAuthLogs")
      .withIndex("by_userId_createdAt", (q) =>
        q.eq("userId", user._id).gte("createdAt", tenMinutesAgo),
      )
      .collect();

    if (recentAuthRequests.length >= 10) {
      throw new Error("Rate limit exceeded. Please wait before requesting another upload.");
    }

    await ctx.db.insert("uploadAuthLogs", {
      userId: user._id,
      createdAt: now,
    });

    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!privateKey || !publicKey || !urlEndpoint) {
      throw new Error("ImageKit environment variables are not configured.");
    }

    const token = randomBytes(24).toString("hex");
    const expire = Math.floor(now / 1000) + 10 * 60;

    const signature = createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return {
      token,
      expire,
      signature,
      publicKey,
      urlEndpoint,
      checks: '"file.size" <= "5242880" && "file.mime" == "image/jpeg"',
      folder: "/past-papers-hub",
    };
  },
});
