// src/routes/current/current.js

import pool from '../../db.js';

// Obtener las mediciones de corriente de las últimas 24 horas para una estación específica
export async function get_current(ctx) {
    const { locationId } = ctx.request.query;

    if (locationId === undefined) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos en la consulta" };
        return;
    }

    try {
        // Primero, obtenemos todas las estaciones que corresponden a la ubicación
        const stationsResult = await pool.query(
            `SELECT id FROM charging_station WHERE location_id = $1`,
            [locationId]
        );
        console.log(stationsResult)
        if (stationsResult.rows.length === 0) {
            ctx.status = 404;
            ctx.body = {
                "status": "OK",
                "data": []  // Devolvemos un array vacío para las gráficas vacías
            };
            return;
        }

        // Ahora, obtenemos las mediciones de todas las estaciones de la ubicación seleccionada
        // Lista de IDs de estaciones para la consulta de mediciones
        const stationIds = stationsResult.rows.map(station => station.id);
        console.log(stationIds)
        // Obtener mediciones de las estaciones en las últimas 24 horas
        const query = `
                    SELECT * FROM mediciones
                    WHERE station_id = ANY($1)
                    AND timestamp >= NOW() - INTERVAL '24 HOURS'
                    ORDER BY station_id, timestamp DESC
                `;

        const result = await pool.query(query, [stationIds]);


        if (result.rows.length === 0) {
            ctx.status = 200;
            ctx.body = {
                "status": "OK",
                "data": []  // Devolvemos un array vacío para las gráficas vacías
            };
            return;
        }

        ctx.status = 200;
        ctx.body = {
            "status": "OK",
            "data": result.rows
        };
    } catch (err) {
        console.error("Error al obtener las mediciones de corriente:", err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al obtener las mediciones de corriente" };
    }
}




export async function post_current(ctx) {
    const { stationId, current, timestamp } = ctx.request.body;

    if (stationId === undefined || current === undefined || !timestamp) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos para registrar la medición" };
        return;
    }

    try {
        await pool.query(
            'INSERT INTO mediciones (station_id, current, timestamp) VALUES ($1, $2, $3)',
            [stationId, current, timestamp]
        );

        const stationResult = await pool.query(
            'SELECT occupied FROM charging_stations WHERE id = $1',
            [stationId]
        );

        if (stationResult.rows.length === 0) {
            ctx.status = 404;
            ctx.body = { "status": "NOK", "mensaje": "No se encontró la estación de carga" };
            return;
        }

        const isOccupied = stationResult.rows[0].occupied;

        let newState;
        if (isOccupied === 0) {
            newState = 0;
        } else if (isOccupied === 1) {
            newState = current > 1000 ? 1 : 2;
        }

        await pool.query(
            'UPDATE charging_stations SET estado = $1 WHERE id = $2',
            [newState, stationId]
        );

        ctx.status = 201;
        ctx.body = {
            "status": "OK",
            "mensaje": "Medición de corriente registrada y estado de la estación actualizado correctamente"
        };
    } catch (err) {
        console.error("Error al registrar la medición de corriente o al actualizar el estado de la estación:", err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al registrar la medición de corriente o al actualizar el estado de la estación" };
    }
}
