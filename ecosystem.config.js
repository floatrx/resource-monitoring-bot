module.exports = {
  apps: [
    {
      name: 'resource-monitor',
      script: 'npx',
      args: 'tsx src/index.ts',
      env: {
        NODE_ENV: 'production',
        PORT: 3030,
      },
    },
  ],
};
