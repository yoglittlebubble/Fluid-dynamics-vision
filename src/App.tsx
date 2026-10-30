import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { StreamlinePathline } from './pages/StreamlinePathline'
import { EulerLagrange } from './pages/EulerLagrange'
import { Continuity } from './pages/Continuity'
import { Bernoulli } from './pages/Bernoulli'
import { Pitot } from './pages/Pitot'
import { Momentum } from './pages/Momentum'
import { HeadLines } from './pages/HeadLines'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="streamline" element={<StreamlinePathline />} />
          <Route path="euler-lagrange" element={<EulerLagrange />} />
          <Route path="continuity" element={<Continuity />} />
          <Route path="bernoulli" element={<Bernoulli />} />
          <Route path="pitot" element={<Pitot />} />
          <Route path="momentum" element={<Momentum />} />
          <Route path="headlines" element={<HeadLines />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
