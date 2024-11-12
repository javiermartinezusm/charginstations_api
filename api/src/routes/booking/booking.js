// src/routes/booking/booking.js

import pool from '../../db.js';
import moment from 'moment-timezone';

const timezone = "America/Santiago";

export async function get_booking(ctx) {
    const { locationId, startTime, user_id } = ctx.request.query;
    if (user_id && startTime) {
        const res = await pool.query(
            `SELECT r.id as booking_id, r.station_id, r.user_id, r.inicio_reserva, r.fin_reserva, l.nombre AS location_name
             FROM reservas r
             JOIN chargers_location l ON r.location_id = l.id
             WHERE r.user_id = $1 AND r.inicio_reserva >= $2`,
            [user_id, startTime]
        );

        const bookings = res.rows.map(row => ({
            id: row.booking_id,
            station_id: row.station_id,
            user_id: row.user_id,
            inicio_reserva: row.inicio_reserva,
            fin_reserva: row.fin_reserva,
            location_name: row.location_name
        }));

        ctx.status = 200;
        ctx.body = { 'status': 'OK', 'bookings': bookings };
        return;
    }
    else if (locationId === undefined) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos para la consulta" };
        return;
    }

    try {

        const res = await pool.query(
            `SELECT reservas.station_id, reservas.inicio_reserva, reservas.fin_reserva, 
                        CONCAT(users.nombre, ' ', users.apellido) AS nombre_completo 
                 FROM reservas
                 JOIN users ON reservas.user_id = users.id
                 WHERE reservas.location_id = $1 AND reservas.inicio_reserva >= NOW()`,
            [locationId]
        );

        const bookings = res.rows.map(row => ({
            station_id: row.station_id,
            inicio_reserva: row.inicio_reserva,
            fin_reserva: row.fin_reserva,
            nombre_completo: row.nombre_completo
        }));

        ctx.status = 200;
        ctx.body = { "status": "OK", "bookings": bookings };
        return;
    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al obtener las reservas" };
    }
};

export async function make_booking(ctx) {
    const { user_id, location_id, startTime, endTime } = ctx.request.body;

    if (startTime === undefined || user_id === undefined || location_id === undefined || endTime === undefined) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos para la consulta" };
        return;
    }
    const start = moment.tz(startTime, timezone);
    const end = moment.tz(endTime, timezone);
    const currentTime = moment.tz(timezone);
    if (start <= currentTime) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "La reserva debe ser para un horario futuro." };
        return;
    }
    if (isNaN(start) || isNaN(end) || start >= end) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Fechas no válidas o el tiempo de fin es anterior al de inicio" };
        return;
    }

    try {
        const availableStations = await pool.query(
            'SELECT id FROM charging_station WHERE location_id = $1 AND id NOT IN (SELECT station_id FROM reservas WHERE ((inicio_reserva < $3 AND fin_reserva > $2))) ORDER BY id ASC LIMIT 1',
            [location_id, startTime, endTime]
        );

        if (availableStations.rows.length === 0) {
            ctx.status = 409;
            ctx.body = { "status": "NOK", "mensaje": "No hay estaciones disponibles en ese horario" };
            return;
        }

        const station_id = availableStations.rows[0].id;

        const res = await pool.query(
            'INSERT INTO reservas (station_id, user_id, inicio_reserva, fin_reserva, location_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [station_id, user_id, startTime, endTime, location_id]
        );
        ctx.status = 201;
        ctx.body = { "status": "OK", "mensaje": "Reserva creada con éxito", "bookingId": res.rows[0].id };
        return;

    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al hacer la reserva" };
    }
}

export async function delete_booking(ctx) {
    const { bookingId } = ctx.params;
    const { user_id } = ctx.query;

    if (bookingId === undefined || user_id === undefined) {
        ctx.status = 400;
        ctx.body = { "status": "NOK", "mensaje": "Faltan datos para eliminar la reserva" };
        return;
    }

    try {
        const res = await pool.query(
            'SELECT id FROM reservas WHERE id = $1 AND user_id = $2',
            [bookingId, user_id]
        );

        if (res.rows.length === 0) {
            ctx.status = 404;
            ctx.body = { "status": "NOK", "mensaje": "Reserva no encontrada o no autorizada para eliminar" };
            return;
        }

        await pool.query(
            'DELETE FROM reservas WHERE id = $1 AND user_id = $2',
            [bookingId, user_id]
        );

        ctx.status = 200;
        ctx.body = { "status": "OK", "mensaje": "Reserva eliminada con éxito" };
    } catch (err) {
        console.error('Error al eliminar la reserva:', err);
        ctx.status = 500;
        ctx.body = { "status": "NOK", "mensaje": "Error al eliminar la reserva" };
    }
}