/**
 * Health Dashboard Controller
 *
 * GET /api/health-dashboard?from=2026-03-01&to=2026-03-17
 * GET /api/health-dashboard?from=2026-03-01&to=2026-03-17&include=whoop_recovery,workouts
 * GET /api/health-dashboard/summary?from=2026-03-01&to=2026-03-17
 */

export default {
  async getDashboard(ctx) {
    const { from, to, include } = ctx.query;

    if (!from || !to) {
      return ctx.badRequest('Query params "from" and "to" are required (YYYY-MM-DD)');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return ctx.badRequest('Dates must be in YYYY-MM-DD format');
    }

    const includeArr = include ? (include as string).split(',').map((s: string) => s.trim()) : undefined;

    try {
      const data = await strapi.service('api::health-dashboard.health-dashboard').getDashboard({
        dateRange: { from, to },
        include: includeArr,
      });

      return ctx.send({ data });
    } catch (error) {
      strapi.log.error('Health dashboard error:', error);
      return ctx.internalServerError('Failed to fetch health dashboard');
    }
  },

  async getSummary(ctx) {
    const { from, to } = ctx.query;

    if (!from || !to) {
      return ctx.badRequest('Query params "from" and "to" are required (YYYY-MM-DD)');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return ctx.badRequest('Dates must be in YYYY-MM-DD format');
    }

    try {
      const data = await strapi.service('api::health-dashboard.health-dashboard').getSummary({
        dateRange: { from, to },
      });

      return ctx.send({ data });
    } catch (error) {
      strapi.log.error('Health dashboard summary error:', error);
      return ctx.internalServerError('Failed to fetch health summary');
    }
  },
};
