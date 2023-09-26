import type { OnRpcRequestHandler } from '@metamask/snaps-types'

import {
  backupHandler,
  keygenHandler,
  keyringHandler,
  otherHandlers,
  recoverHandler,
  setup,
  signHandler,
} from '@/rpc/handlers'
import {
  isBackupMethod,
  isKeyringRpcMethod,
  isMPCKeygenMethod,
  isMPCSignMethod,
  isRecoveryMethod,
  permissionsDetect,
} from '@/rpc/permissions'

const onRpcRequest: OnRpcRequestHandler = async snapRequest => {
  const { request, origin } = snapRequest
  const method = request.method

  console.log(
    `request >> (id=${
      request.id ?? 'null'
    }, origin=${origin}, method=${method}) :`,
    request
  )
  try {
    await permissionsDetect(snapRequest)
    await setup()

    // Handle keyring methods.
    if (isKeyringRpcMethod(method)) {
      return keyringHandler(snapRequest)
    }

    if (isMPCKeygenMethod(method)) {
      return keygenHandler(snapRequest)
    }

    if (isMPCSignMethod(method)) {
      return signHandler(snapRequest)
    }

    if (isRecoveryMethod(method)) {
      return recoverHandler(snapRequest)
    }

    if (isBackupMethod(method)) {
      return backupHandler(snapRequest)
    }

    return otherHandlers(snapRequest)
  } catch (e) {
    console.log(
      `request error (id=${
        request.id ?? 'null'
      }, origin=${origin}, method=${method}) :`,
      e
    )
    throw e
  }
}

export { onRpcRequest }
