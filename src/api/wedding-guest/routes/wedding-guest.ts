export default {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/wedding-guests/lookup',
      handler: 'wedding-guest.lookup',
      config: {
        auth: {
          scope: ['api::wedding-guest.wedding-guest.lookup'],
        },
        policies: ['global::api-token-only'],
      },
    },
  ],
};
