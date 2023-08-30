interface MPCSnapContextProps {
  pendingSignatureList: any[]

  loopSignatureList(): Promise<void>
  stopLoopSignatureList(): Promise<void>
}
