// src/routes/index.js

import Router from 'koa-router';
import { get_locations, create_location } from './locations/locations.js';
import { get_stations, create_stations, delete_station } from './stations/stations.js';
import { get_user, create_user } from './users/users.js';
import { get_booking, make_booking, delete_booking } from './booking/booking.js';
import { get_current, post_current} from './current/current.js'
import { update_occupied } from './occupied/occupied.js';

const router = new Router();

// Ubicaciones
router.get("/locations", get_locations);
router.post("/locations", create_location);

// Estaciones
router.get("/stations",get_stations);
router.post("/stations",create_stations);
router.delete("/stations",delete_station);

// Usuarios
router.get("/users",get_user);
router.post("/users",create_user);

// Reservas
router.get("/booking",get_booking);
router.post("/booking",make_booking);
router.delete("/booking/:bookingId", delete_booking);

// Mediciones corriente
router.get("/current", get_current);
router.post("/current", post_current);

// Espacio Ocupado
router.patch("/occupied", update_occupied)

export default router;
