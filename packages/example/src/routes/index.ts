import { lazy } from 'react'

import { RouterEnum } from '@/configs/Enums'
const ROUTER_PATH = process.env.ROUTER_PATH

const routes = [
  {
    path: RouterEnum.home,
    element: lazy(() => import('@/views/home/Home')),
  },
  {
    path: RouterEnum.index,
    element: lazy(() => import('@/views/Index/Index')),
  },
  {
    path: '/webrtc',
    element: lazy(() => import('@/views/webrtc/Index')),
  },
]

export default routes
