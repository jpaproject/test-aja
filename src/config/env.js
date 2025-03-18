const ENV = {
    development: {
        WEB_URL: 'http://192.168.116.30:8000', // http://localhost:8000
        API_URL: 'http://192.168.116.30:8000/api', // http://localhost:8000/api
        WS_URL: 'http://192.168.116.30:3002', // http://localhost:3002
    },
    production: {
        WEB_URL: 'https://api-eh-sparing.grootech.id',
        API_URL: 'https://api-eh-sparing.grootech.id/api',
        WS_URL: 'wss://websocket-api-eh-sparing.grootech.id'
    }
};

const getEnvVars = () => {
    // You can add logic here to determine environment
    return ENV.development;
};

export default getEnvVars(); 