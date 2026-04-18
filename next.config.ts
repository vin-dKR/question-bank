import type { NextConfig } from 'next';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import fs from 'fs';
import path from 'path';

const queryEnginePath = path.resolve('generated/prisma/query-engine-rhel-openssl-3.0.x');
const hasQueryEngine = fs.existsSync(queryEnginePath);

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    },
    serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
    // pdfjs-dist's `pdf.mjs` uses a dynamic `import("./pdf.worker.mjs")` to boot
    // the same-thread fake worker in Node. Next.js's tracer can't see that
    // dynamic specifier, so without this include the worker file is absent from
    // the serverless bundle and PDF parsing fails in prod with
    // "Cannot find module '/var/task/.../pdf.worker.mjs'".
    outputFileTracingIncludes: {
        '/api/school-test/process': [
            './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
        ],
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'jlnhdliotkdqicigwlfl.supabase.co',
                pathname: '/storage/v1/object/public/images/**',
            },
            {
                protocol: 'https',
                hostname: 'jrekcngltfkghrgzgvju.supabase.co',
                pathname: '/storage/v1/object/public/images/**',
            },
            {
                protocol: 'https',
                hostname: 'question-banks.netlify.app',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'question-editor.vercel.app',
                pathname: '/**',
            }
        ],
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Prevent Prisma Client from being treated as an external module
            // eslint-disable-next-line
            config.externals = config.externals.map((external: string | RegExp) => {
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
                                to: '.next/server/generated/prisma/query-engine-rhel-openssl-3.0.x',
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
