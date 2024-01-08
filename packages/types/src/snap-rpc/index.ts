import { AccountMethods } from './account'
import { CommonMethods } from './common'
import { KeygenMethods } from './keygen'
import { RecoveryMethods } from './recovery'
import { RequestMethods } from './requests'
import { SignMethods } from './sign'

export * from './account'
export * from './common'
export * from './keygen'
export * from './recovery'
export * from './requests'
export * from './sign'

export type SnapRpcMethods =
  | AccountMethods
  | CommonMethods
  | KeygenMethods
  | SignMethods
  | RecoveryMethods
  | RequestMethods
