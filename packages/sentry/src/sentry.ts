import * as dotenv from 'dotenv';
import * as sentry from '@sentry/node';

dotenv.config();

if (process.env.SENTRY_DSN) {
	sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV,
	});
}

export { sentry };
