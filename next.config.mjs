/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*', // Match all API routes
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`, // Replace with your backend IP
            },
        ];
    },
};

export default nextConfig;
