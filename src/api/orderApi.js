import {postJson} from './httpClient.js';

const DEFECT_API_URL = '/api/defect';
const RETRY_COUNT = 3;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function sendDefect(dataToSend) {
    for (let attempt = 0; attempt <= RETRY_COUNT; attempt += 1) {
        try {
            return await postJson(DEFECT_API_URL, dataToSend);
        } catch (error) {
            const isClientError = error.status >= 400 && error.status < 500;

            if (attempt === RETRY_COUNT || isClientError) {
                throw error;
            }

            await wait(500 * (attempt + 1));
        }
    }
}
