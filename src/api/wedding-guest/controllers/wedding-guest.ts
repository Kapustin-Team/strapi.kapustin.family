const GUEST_UID = 'api::wedding-guest.wedding-guest' as const;
const SAFE_SLUG = /^[a-z0-9-]{1,160}$/i;

export default {
  async lookup(ctx) {
    const slug = ctx.request.body?.slug;
    if (typeof slug !== 'string' || !SAFE_SLUG.test(slug)) return ctx.notFound();

    try {
      const guest = await strapi.documents(GUEST_UID).findFirst({
        filters: { slug },
        status: 'published',
        fields: ['slug', 'name', 'address', 'note'],
      });
      if (!guest) return ctx.notFound();

      return ctx.send({
        data: {
          slug: guest.slug,
          name: guest.name,
          address: guest.address,
          ...(guest.note ? { note: guest.note } : {}),
        },
      });
    } catch {
      return ctx.notFound();
    }
  },
};
