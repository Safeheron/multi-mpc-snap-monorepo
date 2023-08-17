import { MethodNotSupportedError } from '@metamask/keyring-api'
import type { OnRpcRequestHandler } from '@metamask/snaps-types'

export const loggerHandler: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(
    `request >> (id=${request.id ?? 'null'}, origin=${origin}):`,
    request
  )
  throw new MethodNotSupportedError(request.method)
}
