// src/routes/stations/stations.js

import pool from '../../db.js';

export async function get_stations(ctx) {
    const  locationId = ctx.query.locationId;
    if(locationId===undefined){
        ctx.status = 400;
        ctx.body = {"status": "NOK", "mensaje": "Faltan datos para la consulta"};
        return;
    }
    try {
        const res = await pool.query(
            'SELECT * FROM charging_station WHERE location_id = $1',
            [locationId]
        );
        ctx.status = 200;
        ctx.body = { "status": "OK", "stations": res.rows };
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al obtener estaciones" };
    }
};

export async function create_stations(ctx) {
    const { locationId, quantity} = ctx.request.body;
    if (locationId===undefined || quantity===undefined) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos para la consulta" };
        return;
    }

    try {
        await pool.query('BEGIN');

        let insertedCount = 0;
        for (let i = 0; i < quantity; i++) {
            try {
                await pool.query(
                    'INSERT INTO charging_station (location_id, estado) VALUES ($1,0)',
                    [locationId]
                );
                insertedCount++;
            } catch (err) {
                console.error(`Error al insertar la estación ${i + 1}:`, err);
                break;
            }
        }
        if (insertedCount === quantity) {
            await pool.query('COMMIT');
            ctx.status = 201;
            ctx.body = { "status": "OK", "mensaje": `${quantity} estaciones creadas correctamente`, "cantidad": insertedCount };
        } else {
            await pool.query('ROLLBACK');
            ctx.status = 207;
            ctx.body = {
                "status": "PARTIAL_OK",
                "mensaje": `Se pudieron crear solo ${insertedCount} de ${quantity} estaciones`,
                "cantidad": insertedCount
            };
        }
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al crear las estaciones" };
    }
};

export async function delete_station(ctx) {
    const { locationId, quantity } = ctx.query;

    if (locationId===undefined || quantity===undefined || quantity <= 0) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos o la cantidad de estaciones es inválida" };
        return;
    }

    try {
        const res = await pool.query(
            'SELECT id FROM charging_station WHERE location_id = $1',
            [locationId]
        );

        const stations = res.rows;
        if (stations.length === 0) {
            ctx.status = 404;
            ctx.body = { "status": "NOK", "mensaje": "No se encontraron estaciones en esta ubicación" };
            return;
        }

        let deletedCount = 0;
        let skippedStations = [];

        for (let station of stations) {
            if (deletedCount >= quantity) break;
s
            const reservationRes = await pool.query(
                'SELECT id FROM reservas WHERE station_id = $1 AND inicio_reserva > NOW()',
                [station.id]
            );

            if (reservationRes.rows.length === 0) {
                await pool.query('DELETE FROM reservas WHERE station_id = $1', [station.id]);

                await pool.query('DELETE FROM charging_station WHERE id = $1', [station.id]);
                deletedCount++;
            } else {
                skippedStations.push(station.id);
            }
        }

        ctx.status = 200;
        ctx.body = {
            "status": "OK",
            "mensaje": `${deletedCount} estaciones eliminadas. ${skippedStations.length} estaciones no se eliminaron debido a reservas activas.`,
            "cantidad": deletedCount,
            "omitidas": skippedStations
        };
    } catch (err) {
        console.error("Error al eliminar estaciones:", err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al eliminar estaciones" };
    }
};
