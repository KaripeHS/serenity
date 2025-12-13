
const ENV = {
    dev: {
        API_URL: 'http://10.0.2.2:3000/api', // Android Emulator localhost
    },
    prod: {
        API_URL: 'https://serenity-backend-774652480816.us-central1.run.app/api/mobile',
    }
};

// Production URL for Cloud Run backend
export const Config = {
    API_URL: ENV.prod.API_URL,
};
