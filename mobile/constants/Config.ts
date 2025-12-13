
const ENV = {
    dev: {
        API_URL: 'http://10.0.2.2:3000/api', // Android Emulator localhost
    },
    prod: {
        API_URL: 'https://serenity-erp-prod.uc.r.appspot.com',
    }
};

// For Phase 38 Testing: Force Production URL so user can test on Physical Device without Localhost issues
export const Config = {
    API_URL: 'http://192.168.0.200:3001/api/mobile',
    // API_URL: ENV.prod.API_URL,
};
