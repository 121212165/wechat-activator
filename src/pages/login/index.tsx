import {useState} from 'react'
import Taro from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'

export default function Login() {
  const {signInWithUsername, signUpWithUsername, signInWithWechat} = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    // 注册时才需要勾选协议
    if (!isLogin && !agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    if (!username.trim() || !password.trim()) {
      Taro.showToast({title: '请输入用户名和密码', icon: 'none'})
      return
    }

    // 验证用户名格式（仅允许字母、数字和下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Taro.showToast({title: '用户名仅支持字母、数字和下划线', icon: 'none'})
      return
    }

    setLoading(true)
    const {error} = isLogin
      ? await signInWithUsername(username, password)
      : await signUpWithUsername(username, password)
    setLoading(false)

    if (error) {
      Taro.showToast({title: error.message || '操作失败', icon: 'none'})
      return
    }

    Taro.showToast({title: isLogin ? '登录成功' : '注册成功', icon: 'success'})

    // 登录成功后跳转
    const redirectPath = Taro.getStorageSync('loginRedirectPath')
    if (redirectPath) {
      Taro.removeStorageSync('loginRedirectPath')
      const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`
      const tabBarPages = ['/pages/home/index', '/pages/settings/index']
      if (tabBarPages.includes(normalizedPath)) {
        Taro.switchTab({url: normalizedPath})
      } else {
        Taro.navigateTo({url: normalizedPath})
      }
    } else {
      Taro.switchTab({url: '/pages/home/index'})
    }
  }

  const handleWechatLogin = async () => {
    if (!agreed) {
      Taro.showToast({title: '请先同意用户协议和隐私政策', icon: 'none'})
      return
    }

    setLoading(true)
    const {error} = await signInWithWechat()
    setLoading(false)

    if (error) {
      Taro.showToast({title: error.message || '微信登录失败', icon: 'none'})
      return
    }

    Taro.showToast({title: '登录成功', icon: 'success'})

    const redirectPath = Taro.getStorageSync('loginRedirectPath')
    if (redirectPath) {
      Taro.removeStorageSync('loginRedirectPath')
      const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`
      const tabBarPages = ['/pages/home/index', '/pages/settings/index']
      if (tabBarPages.includes(normalizedPath)) {
        Taro.switchTab({url: normalizedPath})
      } else {
        Taro.navigateTo({url: normalizedPath})
      }
    } else {
      Taro.switchTab({url: '/pages/home/index'})
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-12">
      {/* 标题 */}
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl text-foreground font-bold">公众号内容聚合助手</h1>
        <p className="text-xl text-muted-foreground">定时聚合，精准推送</p>
      </div>

      {/* 当前模式标题 */}
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-3xl text-foreground font-bold">{isLogin ? '登录' : '注册'}</h2>
        <p className="text-base text-muted-foreground">
          {isLogin ? '欢迎回来，请登录您的账号' : '创建新账号，开始使用'}
        </p>
      </div>

      {/* 表单 */}
      <div className="flex flex-col gap-6">
        {/* 用户名输入 */}
        <div className="flex flex-col gap-2">
          <span className="text-xl text-foreground">用户名</span>
          <div className="border border-input bg-card px-4 py-3 overflow-hidden">
            <input
              className="w-full text-xl text-foreground bg-transparent outline-none"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onInput={(e) => {
                const ev = e as any
                setUsername(ev.detail?.value ?? ev.target?.value ?? '')
              }}
            />
          </div>
        </div>

        {/* 密码输入 */}
        <div className="flex flex-col gap-2">
          <span className="text-xl text-foreground">密码</span>
          <div className="border border-input bg-card px-4 py-3 overflow-hidden">
            <input
              className="w-full text-xl text-foreground bg-transparent outline-none"
              type="password"
              placeholder="请输入密码"
              value={password}
              onInput={(e) => {
                const ev = e as any
                setPassword(ev.detail?.value ?? ev.target?.value ?? '')
              }}
            />
          </div>
        </div>

        {/* 用户协议 */}
        <div className="flex items-center gap-2" onClick={() => setAgreed(!agreed)}>
          <div
            className={`w-5 h-5 border flex items-center justify-center ${
              agreed ? 'bg-primary border-primary' : 'border-input'
            }`}>
            {agreed && <div className="i-mdi-check text-xl text-primary-foreground" />}
          </div>
          <span className="text-base text-muted-foreground">我已阅读并同意《用户协议》和《隐私政策》</span>
        </div>

        {/* 登录/注册按钮 */}
        <button
          type="button"
          className={`w-full py-4 flex items-center justify-center leading-none text-xl ${
            loading ? 'bg-primary/50' : 'bg-primary'
          } text-primary-foreground transition`}
          onClick={handleSubmit}>
          {loading ? '处理中...' : isLogin ? '登录' : '注册'}
        </button>

        {/* 切换登录/注册 */}
        <div className="flex items-center justify-center">
          <span className="text-base text-muted-foreground">
            {isLogin ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            type="button"
            className="text-base text-accent ml-2"
            onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '立即注册' : '立即登录'}
          </button>
        </div>

        {/* 微信登录 */}
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-base text-muted-foreground">其他登录方式</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            className={`w-full py-4 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition ${
              loading ? 'opacity-50' : ''
            }`}
            onClick={handleWechatLogin}>
            <div className="i-mdi-wechat text-2xl mr-2" />
            微信登录
          </button>
        </div>
      </div>
    </div>
  )
}
