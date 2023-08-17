module.exports = {
  cliOptions: {
    src: './src/index.d.ts',
    port: 4100,
  },
  bundlerCustomizer: bundler => {
    bundler.transform('brfs')
  },
}
