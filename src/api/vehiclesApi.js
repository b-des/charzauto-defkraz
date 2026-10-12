import {getJson} from './httpClient.js';

export async function getVehiclesCatalog({signal} = {}) {
    const response = await getJson('/api/vehicles', {signal});

    if (!Array.isArray(response)) {
        throw new Error('The API returned an invalid vehicles payload');
    }

    return response;
}
