const HOST = import.meta.env.VITE_API_HOST ?? 'http://localhost:5155';

export async function getJson(url, {signal} = {}) {
    console.log(url);
    const response = await fetch(HOST + url, {signal});

    if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
}

export async function postJson(url, data, {signal} = {}) {

    const response = await fetch(HOST + url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
        signal,
    });

    if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return response.headers.get('content-type')?.includes('application/json')
        ? response.json()
        : null;
}
