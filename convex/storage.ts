// File storage. The client calls generateUploadUrl, POSTs the photo to the
// returned URL, gets back a storageId, then passes it as
// completeHabit's proof.photoStorageId.

import { mutation } from './_generated/server';
import { getOrCreateUser } from './lib/users';

/** Short-lived signed URL the client uploads a proof photo to. Auth required. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Ensure the caller is authenticated (and provisioned) before issuing a URL.
    await getOrCreateUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
