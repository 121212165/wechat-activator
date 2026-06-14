import {createContext, useContext, useEffect, useState, type ReactNode} from 'react'
import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'
import type {User} from '@supabase/supabase-js'
import type {Profile} from '@/db/types'
import {getProfile} from '@/db/api'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithUsername: (username: string, password: string) => Promise<{error: Error | null}>
  signUpWithUsername: (username: string, password: string) => Promise<{error: Error | null}>
  signInWithWechat: () => Promise<{error: Error | null}>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user) { setProfile(null); return }
    const profileData = await getProfile(user.id)
    setProfile(profileData)
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(({data: {session}}) => {
        setUser(session?.user ?? null)
        if (session?.user) getProfile(session.user.id).then(setProfile)
        setLoading(false)
      })
      .catch(() => { setUser(null); setProfile(null); setLoading(false) })

    const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) getProfile(session.user.id).then(setProfile)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const {error} = await supabase.auth.signInWithPassword({email: `${username}@miaoda.com`, password})
      if (error) throw error
      return {error: null}
    } catch (error) { return {error: error as Error} }
  }

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const {error} = await supabase.auth.signUp({email: `${username}@miaoda.com`, password})
      if (error) throw error
      return {error: null}
    } catch (error) { return {error: error as Error} }
  }

  const signInWithWechat = async () => {
    try {
      if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) throw new Error('仅支持微信小程序登录，网页端请使用用户名密码登录')
      const loginResult = await Taro.login()
      const {data, error} = await supabase.functions.invoke('wechat_miniapp_login', {body: {code: loginResult?.code}})
      if (error) { const msg = (await error?.context?.text?.()) || error.message; throw new Error(msg) }
      const {error: verifyError} = await supabase.auth.verifyOtp({token_hash: data.token, type: 'email'})
      if (verifyError) throw verifyError
      return {error: null}
    } catch (error) { return {error: error as Error} }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{user, profile, loading, signInWithUsername, signUpWithUsername, signInWithWechat, signOut, refreshProfile}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
