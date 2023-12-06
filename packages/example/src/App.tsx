import { FC, StrictMode, Suspense } from 'react'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'

import Footer from '@/containers/Footer'
import routes from '@/routes'

const App: FC = () => (
  <StrictMode>
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
  </StrictMode>
)
export default App
