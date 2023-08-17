const typescript = require('@rollup/plugin-typescript')
const commonJs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve')
const progress = require('rollup-plugin-progress')
const clear = require('rollup-plugin-clear')
const path = require('path')

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/index.ts',
  output: [
    { dir: './dist/esm', format: 'esm' },
    { dir: './dist/cjs', format: 'cjs' },
  ],
  plugins: [
    clear({
      targets: [path.resolve(__dirname, 'dist')],
    }),
    commonJs(),
    resolve(),
    typescript(),
    progress(),
  ],
}

module.exports = config
