import { UserRejectError } from '@/utils/Errors'

export enum DialogType {
  Alert = 'alert',
  Confirmation = 'confirmation',
  Prompt = 'prompt',
}

export async function requestConfirm(content: any) {
  const confirmRes = await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Confirmation,
      content,
    },
  })
  if (!confirmRes) {
    throw new UserRejectError()
  }
}

export async function requestAlert(content: any) {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: DialogType.Alert,
      content,
    },
  })
}
