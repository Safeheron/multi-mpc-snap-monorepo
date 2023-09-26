import SnapsWebpackPlugin from '@metamask/snaps-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'
import webpack, { Configuration } from 'webpack'

const isProd = process.env.NODE_ENV === 'production'

const ALLOW_SITES = [
  'https://test-mpcsnap.safeheron.com',
  'https://mpcsnap.safeheron.com',
]
if (!isProd) {
  ALLOW_SITES.push('http://localhost:8080')
}

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
    }),
  ],
  stats: 'minimal',
  watchOptions: {
    ignored: ['**/snap.manifest.json'],
  },
  optimization: {
    minimize: isProd,
  },
}

export default config
