const ewelink = require('ewelink-api');
const fetch = require('node-fetch'); // Asegúrate de tener node-fetch instalado
const { DateTime } = require('luxon'); // Importa luxon para manejar la zona horaria

// Conexión a eWeLink
const connection = new ewelink({
    at: '',
    region: 'us',
});

// Contador global
let measurementCount = 0;

async function queryDevice() {
    try {
        const device = await connection.getDevice('1000fe3d5f');
        measurementCount++; // Incrementa el contador

        // Ajusta la hora a la zona horaria de Chile
        const currentTime = DateTime.now()
            .setZone('America/Santiago') // Zona horaria de Chile
            .toISO(); // Formato ISO 8601 para timestamps

        const currentPower = device.params.power || 0; // Ejemplo: toma el valor de potencia actual
        
        console.log(`Measurement #${measurementCount} at ${currentTime}`);
        console.log('Power:', currentPower);

        // Preparar datos para enviar en el POST
        const data = {
            stationId: 50,
            current: currentPower,
            timestamp: currentTime,
        };

        // Realizar el POST
        const response = await fetch('http://localhost:5000/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error('Failed to post data:', await response.text());
        }
    } catch (error) {
        console.error('Error: ', error);
    }
}

// Ejecuta queryDevice cada 5 segundos
const intervalId = setInterval(queryDevice, 5000);

// Escucha para una señal de interrupción para detener el programa
process.on('SIGINT', () => {
    console.log(`Total measurements taken: ${measurementCount}`);
    console.log('Aborting program...');
    clearInterval(intervalId);
    process.exit();
});
