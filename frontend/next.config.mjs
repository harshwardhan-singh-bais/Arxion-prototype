import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
        resolveAlias: {
            // Force a single React instance — prevents the ReactCurrentOwner crash with @react-three/fiber
            "react": path.resolve(__dirname, "node_modules/react"),
            "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        },
    },

    webpack(config) {
        // Same dedup for webpack mode
        config.resolve.alias = {
            ...config.resolve.alias,
            react: path.resolve(__dirname, "node_modules/react"),
            "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        };
        return config;
    },

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:8000/api/v1/:path*",
            },
        ];
    },
};

export default nextConfig;
