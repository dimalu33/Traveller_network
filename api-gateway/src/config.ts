import dotenv from 'dotenv';

dotenv.config();

export default {
    port: process.env.API_GATEWAY_PORT || 3000,
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    // postServiceUrl: process.env.POST_SERVICE_URL || 'http://localhost:3002',
};