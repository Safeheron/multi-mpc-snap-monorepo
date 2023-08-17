type DetectMediaResponse = {
  support: boolean
  message?: string
}

export async function detectMediaAbility(): Promise<DetectMediaResponse> {
  if (
    !('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices)
  ) {
    return {
      support: false,
      message:
        'Please confirm whether your device supports the camera, and whether the current webpage is under the "https" protocol.',
    }
  }

  try {
    const devices = await navigator.mediaDevices.getUserMedia({
      video: true,
    })
  } catch (e) {
    console.error('cannot access user media, error: ', e)
    return {
      support: false,
      message:
        "Unable to access your device's camera, please make sure the camera is turned on, and the current page has been allowed to access the camera.",
    }
  }

  return { support: true }
}
