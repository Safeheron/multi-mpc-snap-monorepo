import { RouterEnum } from '@/configs/Configs'
import FaqIndex from '@/views/faq/Index'
import Home from '@/views/home/Home'
import Index from '@/views/Index'

const ROUTER_PATH = process.env.ROUTER_PATH

const routes = [
  {
    path: RouterEnum.home,
    element: Home,
  },
  {
    path: RouterEnum.index,
    element: Index,
  },
  {
    path: RouterEnum.faq,
    element: FaqIndex,
  },
]

export default routes
