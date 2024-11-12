// src/routes/occupied/occupied.js

import pool from '../../db.js'

export async function update_occupied(ctx){
    const {stationId, status} = ctx.request.body;
    if(stationId === undefined||status===undefined){
        ctx.status = 400;
        ctx.body = {"status": "NOK", "mensaje": "Faltan datos para la consulta"};
        return; 
    }
    try{
        console.log("1")
        const update = await pool.query(
            'UPDATE charging_station SET occupied = $1 WHERE id = $2',
            [status, stationId]
        )
        console.log("1")
        ctx.status = 200;
        ctx.body = {
            "status": "OK",
            "mensaje": `Se actualizo la estación ${stationId} al estado ${status} correctamente.`
        };
    } catch (err){
        console.error("Error al actualizar el estado de la estacion:".err);
        ctx.status = 500;
        ctx.body = {"status": "NOK",
            "mensaje": "Error al actualizar la estacion"
        }
    }
};