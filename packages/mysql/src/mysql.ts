import * as mysql from 'mysql2/promise';

const config = {
	host: process.env.MYSQL_DB_HOST || '127.0.0.1',
	port: parseInt(process.env.MYSQL_DB_PORT) || 3306,
	user: process.env.MYSQL_DB_USER,
	password: '',
	database: process.env.MYSQL_DB_NAME,
	dateStrings: true,
	connectionLimit: 100,
	typeCast: function castField(field: { type: string; length: number; buffer: () => any; },
		useDefaultTypeCasting: () => any) {
		// We only want to cast bit fields that have a single-bit in them. If the field
		// has more than one bit, then we cannot assume it is supposed to be a Boolean.
		if ((field.type === 'BIT') && (field.length === 1)) {
			const bytes = field.buffer();
			// A Buffer in Node represents a collection of 8-bit unsigned integers.
			// Therefore, our single "bit field" comes back as the bits '0000 0001',
			// which is equivalent to the number 1.
			return (bytes[0] === 1);
		}
		return (useDefaultTypeCasting());
	},
};

if (process.env.MYSQL_DB_PASSWORD && process.env.MYSQL_DB_PASSWORD.length) {
	config.password = process.env.MYSQL_DB_PASSWORD;
}

export default mysql.createPool(config);
