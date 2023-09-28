const typescript = require('@rollup/plugin-typescript')
const commonJs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve')
const progress = require('rollup-plugin-progress')
const clear = require('rollup-plugin-clear')

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/index.ts',
  output: [
    { file: './dist/esm/index.js', format: 'esm' },
    { file: './dist/cjs/index.js', format: 'cjs' },
  ],
  plugins: [commonJs(), resolve(), typescript(), progress()],
}

module.exports = config
