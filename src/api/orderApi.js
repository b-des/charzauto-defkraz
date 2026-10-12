import {postJson} from './httpClient.js';

const DEFECT_API_URL = '/api/defect';

export async function sendDefect(dataToSend) {
    return postJson(DEFECT_API_URL, dataToSend);
}
