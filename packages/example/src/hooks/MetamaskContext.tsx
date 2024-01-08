import type { Dispatch, ReactNode, Reducer } from 'react'
import React, { createContext, useEffect, useReducer } from 'react'

import { Snap } from '@/@types/snap'
import { getSnap } from '@/utils/snap'

import { isSupportSnap } from '../utils/metamask'

export type MetamaskState = {
  supportedSnap: boolean
  installedSnap?: Snap
  error?: Error
}

const initialState: MetamaskState = {
  supportedSnap: false,
}

type MetamaskDispatch = { type: MetamaskActions; payload: any }

export const MetaMaskContext = createContext<
  [MetamaskState, Dispatch<MetamaskDispatch>]
>([
  initialState,
  () => {
    /* no op */
  },
])

export enum MetamaskActions {
  SetSnapSupported = 'SetSnapSupported',
  SetInstalled = 'SetInstalled',
  SetError = 'SetError',
}

const reducer: Reducer<MetamaskState, MetamaskDispatch> = (state, action) => {
  switch (action.type) {
    case MetamaskActions.SetSnapSupported:
      return {
        ...state,
        supportedSnap: action.payload,
      }

    case MetamaskActions.SetInstalled:
      return {
        ...state,
        installedSnap: action.payload,
      }

    case MetamaskActions.SetError:
      return {
        ...state,
        error: action.payload,
      }

    default:
      return state
  }
}

/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
export const MetaMaskProvider = ({ children }: { children: ReactNode }) => {
  if (typeof window === 'undefined') {
    return <>{children}</>
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const detectInstallation = async () => {
      /**
       * Detect if MetaMask support snap
       */
      async function detectSupportSnap() {
        const supportSnapFeature = await isSupportSnap()

        dispatch({
          type: MetamaskActions.SetSnapSupported,
          payload: supportSnapFeature,
        })
      }

      /**
       * Detect if the mpc snap is installed.
       */
      async function detectSnapInstalled() {
        const installedSnap = await getSnap()
        dispatch({
          type: MetamaskActions.SetInstalled,
          payload: installedSnap,
        })
      }

      await detectSupportSnap()

      if (state.supportedSnap) {
        await detectSnapInstalled()
      }
    }

    detectInstallation().catch(console.error)
  }, [state.supportedSnap, window.ethereum])

  useEffect(() => {
    let timeoutId: number

    if (state.error) {
      timeoutId = window.setTimeout(() => {
        dispatch({
          type: MetamaskActions.SetError,
          payload: undefined,
        })
      }, 10000)
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [state.error])

  return (
    <MetaMaskContext.Provider value={[state, dispatch]}>
      {children}
    </MetaMaskContext.Provider>
  )
}
