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
  setupHandler,
  loggerHandler,
  permissionsHandler,
  internalMPCHandler,
  keygenHandler,
  backupHandler,
  signHandler,
  recoverHandler,
  keyringHandler
)

const onRpcRequest: OnRpcRequestHandler = async snapRpcRequest => {
  try {
    const response = await handler(snapRpcRequest)
    console.log(
      `response by request method [${snapRpcRequest.request.method}] >>`,
      response
    )
    return response
  } catch (e) {
    console.log('handle rpc request error: ', e)
    return errored(e?.message ?? 'Unknown error.')
  }
}

export { onRpcRequest }
