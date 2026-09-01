import {useEffect, useState} from 'react';
import nodes from '../assets/vehicles/all.json';
import {getVehiclesCatalog} from '../api/vehiclesApi.js';

export function useVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        getVehiclesCatalog({signal: controller.signal})
            .then(setVehicles)
            .catch((requestError) => {
                if (requestError.name !== 'AbortError') {
                    setVehicles(nodes);
                    setError('Не вдалося завантажити список автомобілів із сервера. Інформація про деталі може бути застарілою!');
                    setTimeout(() => setError(""), 5000)
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => controller.abort();
    }, []);

    return {vehicles, isLoading, error};
}
