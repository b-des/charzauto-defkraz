import {getJson} from './httpClient.js';

const VEHICLES_API_URL = '/api/vehicles';

export async function getVehicles({signal} = {}) {
    const payload = await getJson(VEHICLES_API_URL, {signal});
    const vehicles = Array.isArray(payload) ? payload : payload.value ?? payload.Value;

    if (!Array.isArray(vehicles)) {
        throw new Error('The API returned an invalid vehicles payload');
    }

    return vehicles;
}
