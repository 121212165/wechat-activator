import {useState, useCallback, useEffect} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'
import {getProfile} from '@/db/api'
import type {Profile} from '@/db/types'

function ProfilePage() {
  const {user, signOut} = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const profileData = await getProfile(user.id)
    setProfile(profileData)
    setLoading(false)
  }, [user])

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSignOut = async () => {
    const res = await Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？'
    })

    if (res.confirm) {
      await signOut()
      Taro.showToast({title: '已退出登录', icon: 'success'})
      Taro.redirectTo({url: '/pages/login/index'})
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xl text-muted-foreground">加载中...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* 用户信息 */}
        <div className="flex flex-col gap-4 py-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-muted flex items-center justify-center">
              <div className="i-mdi-account text-4xl text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl text-foreground font-bold">
                {profile?.username || '未设置用户名'}
              </span>
              <span className="text-base text-muted-foreground">
                {profile?.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </div>
          </div>
        </div>

        {/* 功能列表 */}
        <div className="flex flex-col gap-3">
          <div
            className="flex items-center justify-between py-4 border-b border-border"
            onClick={() => Taro.navigateTo({url: '/pages/push-settings/index'})}>
            <div className="flex items-center gap-3">
              <div className="i-mdi-bell text-2xl text-foreground" />
              <span className="text-xl text-foreground">推送设置</span>
            </div>
            <div className="i-mdi-chevron-right text-2xl text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="i-mdi-information text-2xl text-foreground" />
              <span className="text-xl text-foreground">关于</span>
            </div>
            <span className="text-base text-muted-foreground">v1.0.0</span>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="flex flex-col gap-4 mt-8">
          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl border border-destructive text-destructive transition"
            onClick={handleSignOut}>
            退出登录
          </button>
        </div>

        {/* 版权信息 */}
        <div className="flex flex-col items-center gap-2 mt-12">
          <span className="text-base text-muted-foreground">公众号内容聚合助手</span>
          <span className="text-sm text-muted-foreground">© 2026 公众号内容聚合助手</span>
        </div>
      </div>
    </div>
  )
}

export default withRouteGuard(ProfilePage)
