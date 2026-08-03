import { defineConfig } from 'orval';

export default defineConfig({
    charzapi: {
        input: 'http://localhost:5157/swagger/v1/swagger.json', // Or a remote URL
        output: {
            target: './src/api/generated.ts',
            schemas: './src/api/model',
            client: 'react-query', // Generates TanStack Query hooks
            baseUrl: {
                runtime: 'import.meta.env.VITE_API_HOST ?? \'http://localhost:5155\'',
            },
            mode: 'split',
        },
    },
});
