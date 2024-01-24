import type {
  OnKeyringRequestHandler,
  OnRpcRequestHandler,
} from '@metamask/snaps-types'

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
  const { request } = snapRequest
  const method = request.method

  try {
    await permissionsDetect(snapRequest)
    await setup()

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
    throw e
  }
}

const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}) => {
  await permissionsDetect({ origin, request })
  await setup()
  const method = request.method

  // Handle keyring methods.
  if (isKeyringRpcMethod(method)) {
    return keyringHandler({ origin, request })
  }
}

export { onKeyringRequest, onRpcRequest }
