import log from 'loglevel'

export const enum LogType {
  WEBRTC = 'webrtc',
  SNAP_RPC = 'snap_rpc',
}

export function getLogger(logType: LogType) {
  return log.getLogger(logType)
}

export const logger = log
