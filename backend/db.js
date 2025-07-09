import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '@DanielMysql2025',
  database: 'fondo_familiar'
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión a MySQL:', err);
  } else {
    console.log('Conectado a MySQL (db.js)');
  }
});

export default connection;
