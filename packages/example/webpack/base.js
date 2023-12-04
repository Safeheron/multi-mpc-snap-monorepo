import dotenv from 'dotenv'
import DotenvWebpack from 'dotenv-webpack'
import path from 'path'

import { aliasItems } from './config'
import entry from './entry'
import optimization from './optimization'
import * as plugins from './plugins'
import * as rules from './rules'
import {isDevServer, isProd, rootDir, VERSION} from './utils/env'
import { arrayFilterEmpty } from './utils/helpers'


const envPath = path.resolve(rootDir, `.env.${process.env.NODE_ENV}`)
dotenv.config({
  path: path.resolve(rootDir, `.env.${process.env.NODE_ENV}`),
})

const publicPath =
  isDevServer || isProd
    ? '/'
    : `${process.env.ASSETS_URL}${process.env.ROUTER_PATH}${VERSION}/`

export default {
  context: __dirname,
  target: isDevServer ? 'web' : ['web', 'es5'],
  mode: isDevServer ? 'development' : 'production',
  entry,
  output: {
    path: path.join(__dirname, '../dist'),
    // publicPath: '/',
    filename: isDevServer ? `${VERSION}/js/[name].[fullhash].js` : `${VERSION}/js/[name].[contenthash].js`,
    assetModuleFilename: 'assets/[name][ext]',
    chunkFilename: `${VERSION}/js/[name].js`
  },
  module: {
    generator: {
      'asset/resource': {
        publicPath: '/',
      },
    },
    rules: arrayFilterEmpty([
      rules.javascriptRule,
      rules.typescriptRule,
      rules.htmlRule,
      rules.imageRule,
      rules.fontsRule,
      rules.cssRule,
      ...rules.lessRules,
      ...rules.svgRules,
    ]),
  },
  plugins: arrayFilterEmpty([
    new DotenvWebpack({ path: envPath }),
    plugins.htmlWebpackPlugin,
    plugins.providePlugin,
    plugins.definePlugin,
    plugins.miniCssExtractPlugin,
    plugins.copyPlugin,
    // plugins.forkTsCheckerWebpackPlugin,
    // plugins.esLintPlugin,
  ]),
  resolve: {
    alias: aliasItems,
    extensions: ['.tsx', '.ts', '.js', '.jsx', '...'],
    fallback: {
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      http: false,
      https: false,
      zlib: false,
      tty: false,
      os: false
    },
  },
  optimization,
}
