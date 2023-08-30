import SnapsWebpackPlugin from '@metamask/snaps-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'
import webpack, { Configuration } from 'webpack'

const config: Configuration = {
  mode: 'none',
  entry: './src/index.ts',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: './dist',
    libraryTarget: 'commonjs',
  },
  resolve: {
    extensions: ['.ts', '...'],
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
        test: /\.wasm$/,
        type: 'javascript/auto',
        use: [
          {
            loader: 'webassembly-loader',
            options: {
              export: 'buffer',
            },
          },
        ],
      },
      {
        test: /\.(m?js|ts)x?$/u,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
      },
    ],
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
  ],
  stats: 'minimal',
  watchOptions: {
    ignored: ['**/snap.manifest.json'],
  },
}

export default config
