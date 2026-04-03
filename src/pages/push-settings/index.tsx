import {useState, useCallback, useEffect} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {Picker} from '@tarojs/components'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'
import {getProfile, updateProfile} from '@/db/api'
import type {Profile} from '@/db/types'

function PushSettings() {
  const {user} = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [pushTime, setPushTime] = useState('18:00')
  const [loading, setLoading] = useState(false)

  // 生成时间选项（0-23点）
  const timeOptions = Array.from({length: 24}, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const profileData = await getProfile(user.id)
    if (profileData) {
      setProfile(profileData)
      setPushEnabled(profileData.push_enabled)
      setPushTime(profileData.push_time)
    }
    setLoading(false)
  }, [user])

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTogglePush = async () => {
    const newValue = !pushEnabled
    setPushEnabled(newValue)

    const success = await updateProfile(user!.id, {push_enabled: newValue})
    if (success) {
      Taro.showToast({title: newValue ? '已开启推送' : '已关闭推送', icon: 'success'})
    } else {
      setPushEnabled(!newValue)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  const handleTimeChange = async (e: any) => {
    const index = e.detail.value
    const newTime = timeOptions[index]
    setPushTime(newTime)

    const success = await updateProfile(user!.id, {push_time: newTime})
    if (success) {
      Taro.showToast({title: '推送时间已更新', icon: 'success'})
    } else {
      Taro.showToast({title: '更新失败', icon: 'none'})
    }
  }

  const handleRequestPermission = () => {
    Taro.showModal({
      title: '开启推送通知',
      content: '请在小程序设置中开启消息通知权限，以便接收每日简报推送',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          Taro.openSetting()
        }
      }
    })
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
        {/* 推送开关 */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="text-xl text-foreground">启用推送</span>
          <button
            type="button"
            className={`w-14 h-8 flex items-center px-1 transition ${
              pushEnabled ? 'bg-accent' : 'bg-muted'
            }`}
            onClick={handleTogglePush}>
            <div
              className={`w-6 h-6 bg-card transition-transform ${
                pushEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 推送时间 */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <span className="text-xl text-foreground">推送时间</span>
          <Picker mode="selector" range={timeOptions} value={timeOptions.indexOf(pushTime)} onChange={handleTimeChange}>
            <div className="flex items-center gap-2">
              <span className="text-xl text-accent">{pushTime}</span>
              <div className="i-mdi-chevron-right text-2xl text-muted-foreground" />
            </div>
          </Picker>
        </div>

        {/* 推送方式说明 */}
        <div className="flex flex-col gap-3 py-4">
          <span className="text-xl text-foreground">推送方式</span>
          <div className="flex items-center gap-2">
            <div className="i-mdi-bell text-2xl text-accent" />
            <span className="text-base text-muted-foreground">微信服务通知</span>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            每天在设定时间，系统会自动聚合关键词相关的最新文章，并通过微信服务通知推送简报摘要。
          </p>
        </div>

        {/* 授权引导 */}
        <div className="flex flex-col gap-4 mt-4">
          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={handleRequestPermission}>
            <div className="i-mdi-cog text-2xl mr-2" />
            管理通知权限
          </button>
        </div>

        {/* 说明文字 */}
        <div className="flex flex-col gap-2 mt-6">
          <h3 className="text-xl text-foreground font-bold">推送规则</h3>
          <ul className="flex flex-col gap-2 text-base text-muted-foreground leading-relaxed">
            <li>• 系统每天在推送时间前完成内容抓取</li>
            <li>• 按关键词匹配各公众号最新文章</li>
            <li>• 每个关键词每个公众号最多取5条</li>
            <li>• 若无新内容则不推送</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default withRouteGuard(PushSettings)
