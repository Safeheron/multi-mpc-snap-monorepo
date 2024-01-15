import { IS_PROD } from '@/utils'

/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

// export const snap_origin = 'npm:@safeheron/mpcsnap'

export const snap_origin = IS_PROD
  ? 'npm:@safeheron/mpcsnap'
  : 'local:http://localhost:4100'

export const snap_version = '2.4.7'
