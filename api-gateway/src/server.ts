import app from './app';
import config from './config';

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});