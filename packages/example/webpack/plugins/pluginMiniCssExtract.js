import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import {VERSION} from "../utils/env";

const config = {
  // Options similar to the same options in webpackOptions.output
  // both options are optional
  filename: `${VERSION}/css/[name].[contenthash].css`,
  chunkFilename: `${VERSION}/css/[id].[contenthash].css`,
}

export const miniCssExtractPlugin = new MiniCssExtractPlugin(config)
