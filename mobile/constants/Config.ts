
const ENV = {
    dev: {
        API_URL: 'http://10.0.2.2:3000/api', // Android Emulator localhost
    },
    prod: {
        API_URL: 'https://serenity-erp-prod.uc.r.appspot.com',
    }
};

export const Config = {
    API_URL: process.env.NODE_ENV === 'development' ? ENV.dev.API_URL : ENV.prod.API_URL,
};
