import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import { RedisOptions } from 'ioredis';

class RedisClient {
	readonly client: Redis;
	readonly expireTime: number;
	readonly keyPrefix: string;
	readonly disabled: boolean;

	constructor() {
		dotenv.config();
		this.keyPrefix = process.env.REDIS_PREFIX ? `${process.env.REDIS_PREFIX}:` : '';
		this.expireTime = Number(process.env.REDIS_EXPIRE_TIME) || 3600;
		this.disabled = Boolean(process.env.REDIS_DISABLED);
		const options: RedisOptions = {
			host: process.env.REDIS_HOST,
			port: Number(process.env.REDIS_PORT) || 6379,
			db: process.env.NODE_ENV === 'prod' ? 1 : 0,
			keyPrefix: this.keyPrefix,
		};
		if (process.env.REDIS_USER && process.env.REDIS_PASSWORD) {
			options.username = process.env.REDIS_USER;
			options.password = process.env.REDIS_PASSWORD;
		}
		this.client = new Redis(options);
	}

	async setObject(key: string, object: any) {
		return this.disabled ? 'OK' : await this.client.set(key, JSON.stringify(object), 'EX', this.expireTime);
	}

	async getObject(key: string) {
		const object = this.disabled ? null : await this.client.get(key);
		if (object) {
			return JSON.parse(object);
		}
		return object;
	}

	async getSetObject(key: string, object: () => Promise<any>) {
		let cachedObject = await this.getObject(key);
		if (!cachedObject) {
			cachedObject = await object();
			await this.setObject(key, cachedObject);
		}
		return cachedObject;
	}

	async delete(prefix: string) {
		if (!this.disabled) {
			let batch: string[] = [];
			const keys = (await this.client.keys(`${this.keyPrefix}${prefix}*`))
				.map(key => key.substr(this.keyPrefix.length));
			do {
				batch = keys.splice(0, 1000);
				if (batch.length) {
					await this.client.del(batch);
				}
			} while (keys.length > 0);
		}
	}
}

export default new RedisClient();
