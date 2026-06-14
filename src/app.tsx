import type React from 'react'
import type {PropsWithChildren} from 'react'
import {AuthProvider} from '@/contexts/AuthContext'

import './app.scss'

const App: React.FC = ({children}: PropsWithChildren<unknown>) => {
  return <AuthProvider>{children}</AuthProvider>
}

export default App
