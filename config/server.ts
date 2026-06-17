import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => {
  const host = env('HOST') || '0.0.0.0';
  const port = Number(env('PORT')) || 1337;

  return {
    host,
    port,
    app: {
      keys: env.array('APP_KEYS'),
    },
  };
};

export default config;
