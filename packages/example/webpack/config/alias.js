import { join } from 'path'

import { rootDir } from '../utils/env'

export const aliasItems = {
  '@': join(rootDir, '/src'),
}
