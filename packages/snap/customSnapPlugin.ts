import type { PostProcessOptions } from '@metamask/snaps-utils'
import {
  checkManifest,
  evalBundle,
  useTemporaryFile,
} from '@metamask/snaps-utils'
import { assert } from '@metamask/utils'
import pathUtils from 'path'
import { promisify } from 'util'
import type { Compiler } from 'webpack'
import { WebpackError } from 'webpack'

const PLUGIN_NAME = 'SnapsWebpackPlugin'

type PluginOptions = {
  eval?: boolean
  manifestPath?: string
  writeManifest?: boolean
}

export type Options = PluginOptions &
  Omit<PostProcessOptions, 'sourceMap' | 'inputSourceMap'>

/**
 * Use this to speed the build
 */
export default class SnapsWebpackPlugin {
  public readonly options: Partial<Options>

  /**
   * Construct an instance of the plugin.
   *
   * @param options - The post-process options.
   * @param options.stripComments - Whether to strip comments. Defaults to
   * `true`.
   * @param options.eval - Whether to evaluate the bundle to test SES
   * compatibility. Defaults to `true`.
   * @param options.manifestPath - The path to the manifest file. If provided,
   * the manifest will be validated. Defaults to
   * `process.cwd() + '/snap.manifest.json'`.
   * @param options.writeManifest - Whether to fix the manifest.
   * Defaults to `true`.
   */
  constructor(options?: Partial<Options>) {
    this.options = {
      eval: true,
      manifestPath: pathUtils.join(process.cwd(), 'snap.manifest.json'),
      writeManifest: true,
      ...options,
    }
  }

  /**
   * Apply the plugin to the Webpack compiler. Hooks into the `processAssets`
   * stage to process the bundle.
   *
   * @param compiler - The Webpack compiler.
   */
  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, async compilation => {
      const file = compilation
        .getAssets()
        .find(asset => asset.name.endsWith('.js'))

      assert(file)

      assert(compilation.outputOptions.path)
      const outputPath = compilation.outputOptions.path

      const filePath = pathUtils.join(outputPath, file.name)

      const bundleFile = await promisify(
        compiler.outputFileSystem.readFile.bind(compiler.outputFileSystem)
      )(filePath)
      assert(bundleFile)

      const bundleContent = bundleFile.toString()

      if (this.options.eval) {
        await useTemporaryFile('snaps-bundle.js', bundleContent, path =>
          evalBundle(path)
        )
      }

      if (this.options.manifestPath) {
        const { errors, warnings } = await checkManifest(
          pathUtils.dirname(this.options.manifestPath),
          this.options.writeManifest,
          bundleContent,
          promisify(
            compiler.outputFileSystem.writeFile.bind(compiler.outputFileSystem)
          )
        )

        if (!this.options.writeManifest && errors.length > 0) {
          throw new Error(
            `Manifest Error: The manifest is invalid.\n${errors.join('\n')}`
          )
        }

        if (warnings.length > 0) {
          compilation.warnings.push(
            new WebpackError(
              `${PLUGIN_NAME}: Manifest Warning: Validation of snap.manifest.json completed with warnings.\n${warnings.join(
                '\n'
              )}`
            )
          )
        }
      }
    })
  }
}
