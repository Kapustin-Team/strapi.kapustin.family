export default {
  routes: [
    {
      method: 'GET',
      path: '/health-dashboard',
      handler: 'health-dashboard.getDashboard',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get full health dashboard with all metrics filtered by date range',
      },
    },
    {
      method: 'GET',
      path: '/health-dashboard/summary',
      handler: 'health-dashboard.getSummary',
      config: {
        policies: [],
        middlewares: [],
        description: 'Get aggregated health summary for a period',
      },
    },
  ],
};
