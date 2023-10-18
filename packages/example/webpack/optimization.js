import {isProd} from "./utils/env";
import TerserPlugin from "terser-webpack-plugin";

export default {
  runtimeChunk: {
    name: 'runtime',
  },
  splitChunks: {
    cacheGroups: {
      commons: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        chunks: 'initial',
      },
    },
  },
  minimize: isProd,
  minimizer: [
    new TerserPlugin({
      parallel: true,
      extractComments: true,
      terserOptions: {
        compress: {
          drop_debugger: true,
          drop_console: isProd,
        },
      },
      minify: TerserPlugin.swcMinify,
    }),
  ]
}
