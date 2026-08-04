import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import VehicleRepairComponent from './App.jsx'
import {registerSW} from 'virtual:pwa-register'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

registerSW({immediate: true})

export const queryClient = new QueryClient({

    defaultOptions: {

        queries: {

            retry: 0,

            staleTime: 5 * 60 * 1000,

            gcTime: 10 * 60 * 1000,

            refetchOnWindowFocus: false,

        },

    },

});
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <VehicleRepairComponent/>
        </QueryClientProvider>
    </StrictMode>,
)
