const ENV = {
  development: {
    WEB_URL: 'http://localhost:8000',
    API_URL: 'http://localhost:8000/api',
    WS_URL: 'http://localhost:3002',
  },
  production: {
    WEB_URL: 'https://your-production-web.com',
    API_URL: 'https://your-production-api.com/api',
    WS_URL: 'http://localhost:3002',
  }
};

const getEnvVars = () => {
  // You can add logic here to determine environment
  return ENV.development;
};

export default getEnvVars(); 