import { Popover } from 'antd'
import styled from 'styled-components'

import arrow from '@/assets/arrow.png'
import downloadAppstore from '@/assets/download_appstore.png'
import downloadGooglePlay from '@/assets/download_googleplay.png'
import {
  ANDROID_DOWNLOAD_URL,
  IOS_DOWNLOAD_URL,
  METAMASK_EXTENSION_URL,
} from '@/configs/Configs'

const InstallReminderContainer = styled.div`
  padding: 0 80px;
  .tip-container {
    padding-left: 76px;
    p {
      text-align: left;
      color: #6b6d7c;
      margin: 0;
      &:first-child {
        margin-bottom: 10px;
      }
    }
  }
  .btns {
    display: flex;
    justify-content: center;
    margin-top: 35px;
    .link {
      height: 36px;
      border-radius: 36px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      background-color: #dfe3e9;
      font-weight: 500;
      color: #262833;
      cursor: pointer;

      & > img {
        width: 8.5px;
        margin-top: 2px;
        margin-left: 5px;
      }

      &:hover {
        background-color: #cfd6ed;
      }

      &:last-child {
        margin-left: 30px;
      }
    }
  }
`

const DownloadContainer = styled.div`
  width: 267px;
  font-size: 16px;
  display: flex;

  .download-link {
    &.appstore {
      margin-right: 10px;
      img {
        width: 120px;
        margin-top: 6px;
      }
    }

    &.google-play {
      img {
        width: 135px;
      }
    }
  }
`

const InstallReminder = () => {
  return (
    <InstallReminderContainer>
      <div className="tip-container">
        <p>
          Please ensure you've installed MetaMask on your browser and Safeheron
          Snap App on your two mobile phones.
        </p>
        <p>Setup Steps:</p>
        <p>1. Connect MetaMask. </p>
        <p>2. Create your MPC wallet according to the steps on the page.</p>
      </div>
      <div className={'btns'}>
        <a className={'link'} target="_blank" href={METAMASK_EXTENSION_URL}>
          <span>Download MetaMask</span>
          <img src={arrow} />
        </a>
        <Popover
          title={''}
          trigger={'click'}
          placement={'bottom'}
          content={
            <DownloadContainer>
              <div className={'download-link appstore'}>
                <a href={IOS_DOWNLOAD_URL} target={'_blank'}>
                  <img src={downloadAppstore} alt={'Get it on App Store'} />
                </a>
              </div>
              <div className={'download-link google-play'}>
                <a href={ANDROID_DOWNLOAD_URL} target={'_blank'}>
                  <img alt="Get it on Google Play" src={downloadGooglePlay} />
                </a>
              </div>
            </DownloadContainer>
          }>
          <div className={'link'}>
            <span>Install Safeheron Snap App</span>
            <img src={arrow} />
          </div>
        </Popover>
      </div>
    </InstallReminderContainer>
  )
}

export default InstallReminder
