// src/routes/users/users.js

import pool from '../../db.js';
import bcrypt from 'bcrypt';
const saltRounds = 10

export async function get_user(ctx){
    const email = ctx.query.email;
    const password = ctx.query.password;
    if(email===undefined||password===undefined){
        ctx.status = 400;
        ctx.body = {"status": "NOK", "mensaje": "Faltan datos para la consulta"};
        return;
    }
    try{
       
        const res = await pool.query(
            'SELECT * FROM users WHERE correo = $1',[email]
        )
        if (res.rows.length === 0) {
            ctx.status = 404;
            ctx.body = { "status": "NOK", "mensaje": "Usuario o contraseña incorrectos." };
            return;
        }
        const user = res.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            ctx.status = 401;
            ctx.body = { "status": "NOK", "mensaje": "Usuario o contraseña incorrectos." };
            return;
        }
        ctx.status = 200;
        ctx.body = { "status": "OK", "user": { id: user.id, correo: user.correo, nombre: user.nombre, apellido: user.apellido, tipo: user.tipo } };
    } catch (err){
        console.error(err);
        ctx.status = 500;
        ctx.body = {"status": "NOK", "mensaje": "Error al obtener el usuario."};
    }
};

export async function create_user(ctx) {
    const { email, password, name, last_name, tipo } = ctx.request.body;
    if(email===undefined||password===undefined||name===undefined||last_name===undefined||tipo===undefined){
        ctx.status = 400;
        ctx.body = {"status": "NOK", "mensaje": "Faltan datos para la consulta"};
        return;
    }
    try {
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE correo = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            ctx.status = 409;
            ctx.body = { "status": "NOK", "mensaje": "El correo ya está en uso" };
            return;
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const res = await pool.query(
            'INSERT INTO users (correo, password, nombre, apellido, tipo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, hashedPassword, name, last_name,tipo]
        );

        ctx.status = 201;
        ctx.body = { "status": "OK", "user": res.rows[0] };
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al crear el usuario" };
    }
};