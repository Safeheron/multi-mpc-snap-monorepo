import { buildHandlersChain } from '@metamask/keyring-api'
import type { OnRpcRequestHandler } from '@metamask/snaps-types'

import {
  backupHandler,
  internalMPCHandler,
  keygenHandler,
  keyringHandler,
  recoverHandler,
  setupHandler,
  signHandler,
} from '@/rpc/internalMPCHandler'
import { loggerHandler } from '@/rpc/loggerHandler'
import { permissionsHandler } from '@/rpc/permissions'
import { errored } from '@/utils/snapRpcUtil'

// don't change the sort of handlers
const handler: OnRpcRequestHandler = buildHandlersChain(
  loggerHandler,
  permissionsHandler,
  setupHandler,
  internalMPCHandler,
  keygenHandler,
  backupHandler,
  signHandler,
  recoverHandler,
  keyringHandler
)

const onRpcRequest: OnRpcRequestHandler = async snapRpcRequest => {
  try {
    return handler(snapRpcRequest)
  } catch (e) {
    console.log('handle rpc request error: ', e)
    return errored('Unknown error.')
  }
}

export { onRpcRequest }
