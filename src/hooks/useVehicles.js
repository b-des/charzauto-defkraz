import {useEffect, useState} from 'react';
import {getVehicles} from '../api/vehiclesApi.js';

export function useVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        getVehicles({signal: controller.signal})
            .then(setVehicles)
            .catch((requestError) => {
                if (requestError.name !== 'AbortError') {
                    setError('Не вдалося завантажити список автомобілів.');
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
