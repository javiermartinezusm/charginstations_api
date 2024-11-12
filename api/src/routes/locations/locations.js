// src/routes/locations/locations.js

import pool from '../../db.js'; // Asegúrate de que la ruta a db.js sea correcta

export async function get_locations(ctx) {
    try {
        const res = await pool.query('SELECT * FROM chargers_location');
        ctx.status = 200;
        ctx.body = { "status": "OK", "locations": res.rows };
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al obtener ubicaciones" };
    }
}

export async function create_location(ctx) {
    const { name, user_id } = ctx.request.body;
    // Verificar que los datos requeridos están presentes
    if(name===undefined||user_id===undefined){
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos para la consulta" };
        return;
    }
    try {
        const res = await pool.query(
            'INSERT INTO chargers_location (nombre, user_id) VALUES ($1, $2) RETURNING *',
            [name, user_id]
        );
        ctx.status = 201;
        ctx.body = { "status": "OK", "location": res.rows[0] };
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al crear la ubicación" };
    }
}

