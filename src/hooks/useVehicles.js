import {useEffect, useState} from 'react';
import nodes from '../assets/vehicles/all.json';
import {getVehicles} from "../api/generated/charzAPI.ts";

export function useVehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        getVehicles({signal: controller.signal})
            .then(response => setVehicles(response.data))
            .catch((requestError) => {
                if (requestError.name !== 'AbortError') {
                    setError('Не вдалося завантажити список автомобілів із сервера. Інформація про деталі може бути застарілою!');
                    setTimeout(() => setError(""), 5000)
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
                setVehicles(nodes);
            });

        return () => controller.abort();
    }, []);

    return {vehicles, isLoading, error};
}
