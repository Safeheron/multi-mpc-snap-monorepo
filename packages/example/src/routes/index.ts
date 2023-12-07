import { lazy } from 'react'

import { RouterEnum } from '@/configs/Configs'
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
    path: RouterEnum.faq,
    element: lazy(() => import('@/views/faq/Index')),
  },
]

export default routes
