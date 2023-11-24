import { panel, text } from '@metamask/snaps-ui'

import { requestAlert } from '@/utils/snapDialog'
import { succeed } from '@/utils/snapRpcUtil'

export async function onSnapInstallRemainder() {
  await requestAlert(
    panel([
      text('Now you have installed the Safeheron Snap,'),
      text(
        'now head to **mpcsnap.safeheron.com** to setup your new MPC wallet with multi-factor authentication.'
      ),
    ])
  )

  return succeed(true)
}
