import { merge, SnapConfig } from '@metamask/snaps-cli'
import path from 'path'
import type { Configuration as WebpackConfiguration } from 'webpack'

const snapConfig: SnapConfig = {
  bundler: 'webpack',
  input: './src/index.ts',
  sourceMap: false,
  evaluate: false,
  output: {
    path: 'dist',
    filename: 'bundle.js',
    clean: false,
    minimize: true,
  },
  server: {
    port: 4100,
  },
  stats: {
    verbose: true,
  },
  customizeWebpackConfig: (webpackConfig: WebpackConfiguration) => {
    const customConfig: WebpackConfiguration = {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        },
      },
    }

    return merge(webpackConfig, customConfig)
  },
  polyfills: {
    process: true,
    buffer: true,
    stream: true,
    crypto: true,
  },
}

export default snapConfig
