export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: process.env.AUTH_GOOGLE_ID,
      applicationSecret: process.env.AUTH_GOOGLE_SECRET,
    },
  ],
};
