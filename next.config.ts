import type { NextConfig } from 'next';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const nextConfig: NextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Prevent Prisma Client from being treated as an external module
            // eslint-disable-next-line
            config.externals = config.externals.map((external: any) => {
                if (typeof external !== 'string') return external;
                return external === '@prisma/client' ? {} : external;
            });

            // Copy the Query Engine to .next/server
            config.plugins = config.plugins || [];
            config.plugins.push(
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: 'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
                            to: '.next/server/libquery_engine-rhel-openssl-3.0.x.so.node',
                        },
                    ],
                })
            );
        }
        return config;
    },
};

export default nextConfig;
