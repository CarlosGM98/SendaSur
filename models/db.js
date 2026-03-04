const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Studium2023;',
  database: 'sendaSur'
});

module.exports = pool.promise(); // Este .promise() es clave
