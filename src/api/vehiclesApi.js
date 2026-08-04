import {getVehicles} from "./generated/charzAPI.ts";

export async function getVehiclesCatalog({signal} = {}) {
    const {data: response} = await getVehicles({signal});

    if (!Array.isArray(response)) {
        throw new Error('The API returned an invalid vehicles payload');
    }

    return response;
}
