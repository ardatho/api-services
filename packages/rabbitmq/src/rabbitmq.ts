import * as dotenv from 'dotenv';
import * as amqp from 'amqplib';
import { Connection, Channel, ConsumeMessage } from 'amqplib';

class RabbitMQ {
	private readonly url: string;
	private connection: Connection;
	private channel: Channel;
	readonly queuePrefix: string;

	constructor() {
		dotenv.config();
		const auth = process.env.RABBITMQ_USER && process.env.RABBITMQ_PASSWORD ?
			`${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@` : '';
		this.url =
			`amqp://` + auth +
			`${process.env.RABBITMQ_HOST || '127.0.0.1'}:${process.env.RABBITMQ_PORT || 5672}`;
		this.queuePrefix = `${process.env.RABBITMQ_PREFIX}-${process.env.NODE_ENV}`;
	}

	private async getChannel(): Promise<Channel> {
		if (!this.connection) {
			this.connection = await amqp.connect(this.url);
			process.once('SIGINT', () => { this.connection.close(); });
		}
		if (!this.channel) {
			this.channel = await this.connection.createChannel();
		}
		return this.channel;
	}

	async publish<Message>(queue: string, messages: Message[]) {
		const channel = await this.getChannel();
		await channel.assertQueue(this.queueName(queue));
		for (const message of messages) {
			const content = JSON.stringify(message);
			const ready = channel.sendToQueue(this.queueName(queue), Buffer.from(content), { persistent: true });
			if (!ready) {
				await new Promise(resolve => {
					channel.on('drain', () => { resolve(true); });
				});
			}
		}
	}

	async consume<Message>(queue: string, handle: (message: Message) => Promise<void>) {
		const channel = await this.getChannel();
		await channel.assertQueue(this.queueName(queue));
		channel.consume(this.queueName(queue), async (message: ConsumeMessage) => {
			try {
				const content = JSON.parse(message.content.toString());
				await handle(content);
				channel.ack(message);
			} catch (err) {
				console.error(err); // eslint-disable-line no-console
				channel.nack(message, false, true);
			}
		});
	}

	queueName(name: string): string {
		return `${this.queuePrefix}-${name}`;
	}
}

export default new RabbitMQ();
