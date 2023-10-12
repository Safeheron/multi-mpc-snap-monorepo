import { merge, SnapConfig } from '@metamask/snaps-cli'
import path from 'path'
import type { Configuration as WebpackConfiguration } from 'webpack'

const snapConfig: SnapConfig = {
  bundler: 'webpack',
  input: './src/index.ts',
  server: { port: 4100 },
  sourceMap: false,
  evaluate: false,
  output: {
    path: 'dist',
    filename: 'bundle.js',
    clean: false,
    // minimize: true,
  },
  environment: {
    ALLOW_SITES: [
      'https://test-mpcsnap.safeheron.com',
      'https://mpcsnap.safeheron.com',
    ],
    process: { browser: true },
  },
  stats: {
    verbose: true,
    builtIns: {
      ignore: [
        'events',
        'http',
        'https',
        'zlib',
        'util',
        'url',
        'string_decoder',
        'punycode',
        'tty',
        'os',
      ],
    },
  },
  customizeWebpackConfig: (webpackConfig: WebpackConfiguration) => {
    const customConfig: WebpackConfiguration = {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
          process: 'process/browser',
        },
      },
    }

    return merge(webpackConfig, customConfig)
  },
  polyfills: {
    buffer: true,
    stream: true,
    crypto: true,
    process: true,
  },
}

export default snapConfig
