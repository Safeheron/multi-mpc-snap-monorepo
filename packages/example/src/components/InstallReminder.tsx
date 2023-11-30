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
import styles from '@/styles/components/InstallReminder.module.less'

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
    <div className={styles.reminder}>
      <p>
        Please ensure you've installed MetaMask on your browser and Safeheron
        Snap App on your two mobile phones.
      </p>
      <div className={styles.btns}>
        <a
          className={styles.link}
          target="_blank"
          href={METAMASK_EXTENSION_URL}>
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
          <div className={styles.link}>
            <span>Install Safeheron Snap App</span>
            <img src={arrow} />
          </div>
        </Popover>
      </div>
    </div>
  )
}

export default InstallReminder
