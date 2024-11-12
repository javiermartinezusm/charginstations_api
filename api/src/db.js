// src/db.js

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'charging_station',
    password: 'hola1234',
    port: 5432
});

export default pool;