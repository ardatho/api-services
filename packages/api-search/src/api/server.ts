import * as Koa from 'koa';
import * as dotenv from 'dotenv';
import { sentry } from '@ardatho/sentry';

dotenv.config();

export function createApp() {
	const app = new Koa();
	// Custom uncatched error handling
	app.use(async (ctx, next) => next().catch((err) => {
		if (['prod', 'dev'].includes(process.env.NODE_ENV) && err.status >= 500) {
			// Reporting errors
			sentry.withScope((scope) => {
				scope.addEventProcessor(async event =>	sentry.Handlers.parseRequest(event, ctx.request));
				sentry.captureException(err);
			});
		}
		// Display more information about the error
		console.error(err);
	}));
	return app;
}
