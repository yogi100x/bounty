// Convex ↔ Clerk auth configuration.
// The issuer domain comes from the Clerk JWT template named "convex".
// Set CLERK_JWT_ISSUER_DOMAIN in the Convex dashboard (and `.env.local` for
// `convex dev`) to your Clerk Frontend API URL, e.g.
//   https://your-app.clerk.accounts.dev
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};
