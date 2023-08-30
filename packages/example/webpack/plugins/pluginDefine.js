import { DefinePlugin } from 'webpack'

import { isDev, isDevServer, isProd, mode } from '../utils/env'

const config = {
  'process.env.NODE_ENV': JSON.stringify(mode),
  'process.env.IS_PROD': JSON.stringify(isProd),
  'process.env.IS_DEV': JSON.stringify(isDev),
  'process.env.IS_DEV_SERVER': JSON.stringify(isDevServer),
}

export const definePlugin = new DefinePlugin(config)
