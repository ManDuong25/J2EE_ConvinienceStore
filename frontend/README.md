# Convenience Store Frontend

React + Vite single-page app for the Convenience Store backend. Features include product catalog, cart management, checkout via VNPAY redirect, invoice download, and revenue dashboards.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- React Router v6
- Zustand for cart and UI state
- React Hook Form + Yup for validation
- Axios for API requests
- Recharts for analytics visualizations
- react-hot-toast for notifications

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
   Update `VITE_API_BASE_URL` if the backend runs on a different host/port.
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open the app at the URL shown in the terminal (default http://localhost:5173).

## Available Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – type-check and produce production build
- `npm run preview` – preview the production bundle locally

## API Integration
All requests are proxied through `axiosClient` with `VITE_API_BASE_URL` (default `http://localhost:8080/api`). Endpoints used:
- `GET /products` list catalog with filters/pagination
- `POST /orders` create order
- `POST /orders/{id}/payments/vnpay` start VNPAY flow
- `GET /orders/{id}` fetch order status
- `GET /reports/invoices/{orderId}.pdf` download invoice PDF
- `GET /stats/revenue` and `/stats/top-products` for analytics

## Routing
- `/products` – catalog with filters and pagination
- `/cart` – full cart view with quantity management
- `/checkout` – customer form + VNPAY redirect
- `/invoice/:id` – order summary + invoice download
- `/stats` – revenue charts and top product table

Cart state lives in `src/store/cartStore.ts` (Zustand with persistence). Toast notifications provide feedback for API calls and navigation.

## Tailwind Notes
The Tailwind build scans `index.html` and `src/**/*.{ts,tsx}`. Update `tailwind.config.cjs` if new template paths are added.
