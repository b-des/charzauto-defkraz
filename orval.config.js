import { defineConfig } from 'orval';

export default defineConfig({
    charzapi: {
        input: 'openapi.json', // Or a remote URL
        output: {
            target: './src/api/generated',
            schemas: './src/api/model',
            client: 'react-query', // Generates TanStack Query hooks
            baseUrl: {
                runtime: 'import.meta.env.VITE_API_HOST ?? \'http://localhost:5157\'',
            },
            mode: 'split',
            override: {
                query: {
                    useQuery: true,
                },
            },
        },

    },
});
