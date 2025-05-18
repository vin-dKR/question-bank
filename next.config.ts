import type { NextConfig } from 'next';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import fs from 'fs';
import path from 'path';

const queryEnginePath = path.resolve('generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node');
const hasQueryEngine = fs.existsSync(queryEnginePath);

const nextConfig: NextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Prevent Prisma Client from being treated as an external module
            // eslint-disable-next-line
            config.externals = config.externals.map((external: any) => {
                if (typeof external !== 'string') return external;
                return external === '@prisma/client' ? {} : external;
            });

            // Copy Query Engine only if it exists
            config.plugins = config.plugins || [];
            if (hasQueryEngine) {
                config.plugins.push(
                    new CopyWebpackPlugin({
                        patterns: [
                            {
                                from: queryEnginePath,
                                to: '.next/server/generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node',
                            },
                        ],
                    })
                );
                console.log("rhel - installed")
            } else {
                console.warn(
                    `Warning: Prisma Query Engine file not found at ${queryEnginePath}. Skipping copy.`
                );
            }

            // Optimize large string serialization (to address Webpack warning)
            config.optimization = {
                ...config.optimization,
                concatenateModules: false,
            };
        }
        return config;
    },
};

export default nextConfig;
