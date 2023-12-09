import { FC, Suspense } from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'

import Footer from '@/containers/Footer'
import routes from '@/routes'

const App: FC = () => (
  <>
    <Router>
      <Suspense fallback={<div />}>
        <div>
          <Routes>
            {routes.map((route: any) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.element />}
              />
            ))}
          </Routes>
        </div>
      </Suspense>
    </Router>
    <Footer />
  </>
)
export default App
