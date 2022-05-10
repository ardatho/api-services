import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { Client, ClientOptions } from '@elastic/elasticsearch';

class Elasticsearch {
	readonly client: Client;
	readonly indexPrefix: string;

	constructor() {
		dotenv.config();
		const config: ClientOptions = {
			node:
				`http://${process.env.ELASTICSEARCH_HOST || '127.0.0.1'}` +
				`:${process.env.ELASTICSEARCH_PORT || 9243}`,
		};
		if (process.env.ELASTICSEARCH_USER && process.env.ELASTICSEARCH_PASSWORD) {
			config.auth = {
				username: process.env.ELASTICSEARCH_USER,
				password: process.env.ELASTICSEARCH_PASSWORD,
			};
		}
		this.client = new Client(config);
		this.indexPrefix = `${process.env.ELASTICSEARCH_PREFIX}-${process.env.NODE_ENV}`;
	}

	indexAlias(name: string): string {
		return `${this.indexPrefix}-${name}`;
	}

	newIndex(name: string): string {
		return `${this.indexPrefix}-${name}-${crypto.randomBytes(8).toString('hex')}`;
	}
}

export default new Elasticsearch();
