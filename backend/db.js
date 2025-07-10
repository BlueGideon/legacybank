// db.js
import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '@DanielMysql2025',
  database: 'fondo_familiar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('✅ Conectado a MySQL (db.js)');

export default db;

