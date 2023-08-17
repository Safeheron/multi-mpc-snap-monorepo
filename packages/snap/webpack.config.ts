import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import type { Configuration } from 'webpack'
import webpack from 'webpack'

import SnapsWebpackPlugin from './customSnapPlugin'

type RunEnvType = 'dev' | 'test' | 'prod'

// @ts-ignore
const RUN_ENV: RunEnvType = process.env.RUN_ENV || 'dev'
// @ts-ignore
const NODE_ENV: 'development' | 'production' =
  process.env.NODE_ENV || 'development'

const DAPP_SITE_ORIGIN_MAP: Record<RunEnvType, string> = {
  dev: 'http://localhost:8080',
  test: 'https://test-mpcsnap.safeheron.com',
  prod: 'https://mpcsnap.safeheron.com',
}

const addRedirectUrlSuffix = origin => origin + '/#/home'

const REDIRECT_URL_MAP: Record<RunEnvType, string> = {
  dev: addRedirectUrlSuffix(DAPP_SITE_ORIGIN_MAP.dev),
  test: addRedirectUrlSuffix(DAPP_SITE_ORIGIN_MAP.test),
  prod: addRedirectUrlSuffix(DAPP_SITE_ORIGIN_MAP.prod),
}

const isProd = NODE_ENV === 'production'

const ALLOW_SITES = [DAPP_SITE_ORIGIN_MAP[RUN_ENV]]
const REDIRECT_URL = REDIRECT_URL_MAP[RUN_ENV]

console.log(
  `Build snap code use NODE_ENV: ${NODE_ENV}, RUN_ENV: ${RUN_ENV}\n
  ALLOW_SITES: ${ALLOW_SITES}\n
  REDIRECT_URL: ${REDIRECT_URL}\n
  `
)

const config: Configuration = {
  entry: './src/index.ts',
  devtool: false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: './dist',
    libraryTarget: 'commonjs',
  },
  resolve: {
    extensions: ['.ts', '.js', '...'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      process: 'process/browser',
    },
    fallback: {
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      http: false,
      https: false,
      zlib: false,
      tty: false,
      os: false,
    },
  },
  experiments: {
    syncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.(c|m?js|ts)x?$/u,
        resolve: {
          fullySpecified: false,
        },
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
        exclude: /@safeheron\/mpc-wasm-sdk/,
      },
    ],
    noParse: [/@safeheron\/mpc-wasm-sdk/],
  },
  plugins: [
    // @ts-ignore
    new SnapsWebpackPlugin(),
    new CopyPlugin({
      patterns: [{ from: 'static' }],
    }),

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin({
      ALLOW_SITES: JSON.stringify(ALLOW_SITES),
      REDIRECT_URL: JSON.stringify(REDIRECT_URL),
    }),
  ],
  stats: 'minimal',
  watchOptions: {
    ignored: ['**/snap.manifest.json'],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        exclude: /@safeheron\/mpc-wasm-sdk/,
        extractComments: true,
        terserOptions: {
          compress: {
            drop_debugger: true,
            drop_console: isProd,
          },
        },
        minify: TerserPlugin.swcMinify,
      }),
    ],
  },
}

export default config
