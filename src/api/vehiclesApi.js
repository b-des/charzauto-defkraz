import {getVehiclesCatalog} from "./generated.ts";

export async function getVehicles({signal} = {}) {
    const {data: response} = await getVehiclesCatalog({signal});

    if (!Array.isArray(response)) {
        throw new Error('The API returned an invalid vehicles payload');
    }

    return response;
}
