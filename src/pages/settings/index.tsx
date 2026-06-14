import {useState, useCallback, useEffect} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {Picker} from '@tarojs/components'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'
import {
  getProfile,
  updateProfile,
  getKeywords,
  addKeyword,
  updateKeyword,
  deleteKeyword,
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount
} from '@/db/api'
import type {Profile, Keyword, Account} from '@/db/types'

function Settings() {
  const {user, signOut} = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null)
  const [editingKeywordText, setEditingKeywordText] = useState('')
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingAccountText, setEditingAccountText] = useState('')
  const [pushEnabled, setPushEnabled] = useState(true)
  const [pushTime, setPushTime] = useState('18:00')
  const [dataSource, setDataSource] = useState<'sogou' | 'third_party'>('sogou')
  const [apiKey, setApiKey] = useState('')
  const [dsSaving, setDsSaving] = useState(false)

  const timeOptions = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [profileData, keywordsData, accountsData] = await Promise.all([
      getProfile(user.id),
      getKeywords(user.id),
      getAccounts(user.id)
    ])
    setProfile(profileData)
    setKeywords(keywordsData)
    setAccounts(accountsData)
    if (profileData) {
      setPushEnabled(profileData.push_enabled)
      setPushTime(profileData.push_time)
    }
    setDataSource((Taro.getStorageSync('dataSource') as 'sogou' | 'third_party') || 'sogou')
    setApiKey(Taro.getStorageSync('thirdPartyApiKey') || '')
    setLoading(false)
  }, [user])

  useDidShow(() => loadData())
  useEffect(() => { loadData() }, [loadData])

  // --- Profile ---
  const handleSignOut = async () => {
    const res = await Taro.showModal({title: '确认退出', content: '确定要退出登录吗？'})
    if (res.confirm) {
      await signOut()
      Taro.showToast({title: '已退出登录', icon: 'success'})
      Taro.redirectTo({url: '/pages/login/index'})
    }
  }

  // --- Keywords ---
  const handleInitialize = async () => {
    setInitializing(true)
    for (const kw of ['AI', '科技', '互联网']) {
      if (!keywords.some((k) => k.keyword === kw)) await addKeyword(user!.id, kw)
    }
    for (const acc of ['量子位', '赛博禅心', 'AI前线']) {
      if (!accounts.some((a) => a.account_name === acc)) await addAccount(user!.id, acc)
    }
    setInitializing(false)
    Taro.showToast({title: '初始化成功', icon: 'success'})
    loadData()
  }

  const handleAddKeyword = async () => {
    if (keywords.length >= 10) { Taro.showToast({title: '最多支持10个关键词', icon: 'none'}); return }
    Taro.showModal({
      title: '添加关键词',
      content: '请在下方输入框输入关键词',
      success: async (res) => {
        if (res.confirm) {
          const presets = ['AI', '科技', '互联网', '编程', '设计']
          const available = presets.filter((k) => !keywords.some((kw) => kw.keyword === k))
          if (available.length === 0) { Taro.showToast({title: '请手动输入关键词', icon: 'none'}); return }
          const result = await addKeyword(user!.id, available[0])
          if (result) { Taro.showToast({title: '添加成功', icon: 'success'}); loadData() }
          else Taro.showToast({title: '添加失败', icon: 'none'})
        }
      }
    })
  }

  const handleSaveKeyword = async () => {
    if (!editingKeywordText.trim()) { Taro.showToast({title: '关键词不能为空', icon: 'none'}); return }
    const success = await updateKeyword(editingKeywordId!, editingKeywordText.trim())
    if (success) { Taro.showToast({title: '更新成功', icon: 'success'}); setEditingKeywordId(null); setEditingKeywordText(''); loadData() }
    else Taro.showToast({title: '更新失败', icon: 'none'})
  }

  const handleDeleteKeyword = async (id: string, text: string) => {
    const res = await Taro.showModal({title: '确认删除', content: `确定要删除关键词"${text}"吗？`})
    if (res.confirm) {
      const success = await deleteKeyword(id)
      if (success) { Taro.showToast({title: '删除成功', icon: 'success'}); loadData() }
      else Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  // --- Accounts ---
  const handleAddAccount = async () => {
    if (accounts.length >= 20) { Taro.showToast({title: '最多支持20个公众号', icon: 'none'}); return }
    Taro.showModal({
      title: '添加公众号',
      content: '请在下方输入框输入公众号名称',
      success: async (res) => {
        if (res.confirm) {
          const presets = ['量子位', '赛博禅心', 'AI前线', '机器之心', '新智元']
          const available = presets.filter((a) => !accounts.some((acc) => acc.account_name === a))
          if (available.length === 0) { Taro.showToast({title: '请手动输入公众号名称', icon: 'none'}); return }
          const result = await addAccount(user!.id, available[0])
          if (result) { Taro.showToast({title: '添加成功', icon: 'success'}); loadData() }
          else Taro.showToast({title: '添加失败', icon: 'none'})
        }
      }
    })
  }

  const handleSaveAccount = async () => {
    if (!editingAccountText.trim()) { Taro.showToast({title: '公众号名称不能为空', icon: 'none'}); return }
    const success = await updateAccount(editingAccountId!, editingAccountText.trim())
    if (success) { Taro.showToast({title: '更新成功', icon: 'success'}); setEditingAccountId(null); setEditingAccountText(''); loadData() }
    else Taro.showToast({title: '更新失败', icon: 'none'})
  }

  const handleDeleteAccount = async (id: string, name: string) => {
    const res = await Taro.showModal({title: '确认删除', content: `确定要删除公众号"${name}"吗？`})
    if (res.confirm) {
      const success = await deleteAccount(id)
      if (success) { Taro.showToast({title: '删除成功', icon: 'success'}); loadData() }
      else Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  // --- Push ---
  const handleTogglePush = async () => {
    const newValue = !pushEnabled
    setPushEnabled(newValue)
    const success = await updateProfile(user!.id, {push_enabled: newValue})
    if (success) Taro.showToast({title: newValue ? '已开启推送' : '已关闭推送', icon: 'success'})
    else { setPushEnabled(!newValue); Taro.showToast({title: '操作失败', icon: 'none'}) }
  }

  const handleTimeChange = async (e: any) => {
    const newTime = timeOptions[e.detail.value]
    setPushTime(newTime)
    const success = await updateProfile(user!.id, {push_time: newTime})
    if (success) Taro.showToast({title: '推送时间已更新', icon: 'success'})
    else Taro.showToast({title: '更新失败', icon: 'none'})
  }

  // --- Data Source ---
  const handleSaveDataSource = () => {
    setDsSaving(true)
    Taro.setStorageSync('dataSource', dataSource)
    if (dataSource === 'third_party') Taro.setStorageSync('thirdPartyApiKey', apiKey)
    setDsSaving(false)
    Taro.showToast({title: '保存成功', icon: 'success'})
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
      <div className="px-6 py-6 flex flex-col gap-8">

        {/* === Profile === */}
        <div className="flex items-center gap-4 py-4 border-b border-border">
          <div className="w-14 h-14 bg-muted flex items-center justify-center">
            <div className="i-mdi-account text-3xl text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl text-foreground font-bold">{profile?.username || '未设置用户名'}</span>
            <span className="text-base text-muted-foreground">{profile?.role === 'admin' ? '管理员' : '普通用户'}</span>
          </div>
        </div>

        {/* === Quick Initialize === */}
        {keywords.length === 0 && accounts.length === 0 && (
          <div className="flex flex-col gap-3 p-4 border border-accent bg-card">
            <h3 className="text-xl text-foreground font-bold">快速开始</h3>
            <p className="text-base text-muted-foreground">点击按钮自动添加预设关键词和公众号，快速体验。</p>
            <button
              type="button"
              className={`w-full py-3 flex items-center justify-center leading-none text-xl ${initializing ? 'bg-accent/50' : 'bg-accent'} text-accent-foreground transition`}
              onClick={handleInitialize}>
              {initializing ? '初始化中...' : '一键初始化'}
            </button>
          </div>
        )}

        {/* === Keywords === */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-foreground font-bold">关键词</h2>
            <span className="text-base text-muted-foreground">{keywords.length}/10</span>
          </div>
          {keywords.length === 0 ? (
            <span className="text-base text-muted-foreground py-4 text-center">暂无关键词</span>
          ) : (
            <div className="flex flex-col gap-3">
              {keywords.map((kw) => (
                <div key={kw.id} className="flex items-center justify-between py-3 border-b border-border">
                  {editingKeywordId === kw.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 border border-accent bg-card px-3 py-2">
                        <input
                          className="w-full text-xl text-foreground bg-transparent outline-none"
                          type="text"
                          value={editingKeywordText}
                          onInput={(e) => { const ev = e as any; setEditingKeywordText(ev.detail?.value ?? ev.target?.value ?? '') }}
                        />
                      </div>
                      <button type="button" className="text-xl text-accent" onClick={handleSaveKeyword}>
                        <div className="i-mdi-check text-2xl" />
                      </button>
                      <button type="button" className="text-xl text-muted-foreground" onClick={() => { setEditingKeywordId(null); setEditingKeywordText('') }}>
                        <div className="i-mdi-close text-2xl" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xl text-foreground">{kw.keyword}</span>
                      <div className="flex items-center gap-3">
                        <button type="button" className="text-xl text-accent" onClick={() => { setEditingKeywordId(kw.id); setEditingKeywordText(kw.keyword) }}>
                          <div className="i-mdi-pencil text-2xl" />
                        </button>
                        <button type="button" className="text-xl text-destructive" onClick={() => handleDeleteKeyword(kw.id, kw.keyword)}>
                          <div className="i-mdi-delete text-2xl" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="w-full py-3 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={handleAddKeyword}>
            <div className="i-mdi-plus text-2xl mr-2" />添加关键词
          </button>
        </div>

        {/* === Accounts === */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-foreground font-bold">公众号</h2>
            <span className="text-base text-muted-foreground">{accounts.length}/20</span>
          </div>
          {accounts.length === 0 ? (
            <span className="text-base text-muted-foreground py-4 text-center">暂无公众号</span>
          ) : (
            <div className="flex flex-col gap-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between py-3 border-b border-border">
                  {editingAccountId === acc.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 border border-accent bg-card px-3 py-2">
                        <input
                          className="w-full text-xl text-foreground bg-transparent outline-none"
                          type="text"
                          value={editingAccountText}
                          onInput={(e) => { const ev = e as any; setEditingAccountText(ev.detail?.value ?? ev.target?.value ?? '') }}
                        />
                      </div>
                      <button type="button" className="text-xl text-accent" onClick={handleSaveAccount}>
                        <div className="i-mdi-check text-2xl" />
                      </button>
                      <button type="button" className="text-xl text-muted-foreground" onClick={() => { setEditingAccountId(null); setEditingAccountText('') }}>
                        <div className="i-mdi-close text-2xl" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xl text-foreground">{acc.account_name}</span>
                      <div className="flex items-center gap-3">
                        <button type="button" className="text-xl text-accent" onClick={() => { setEditingAccountId(acc.id); setEditingAccountText(acc.account_name) }}>
                          <div className="i-mdi-pencil text-2xl" />
                        </button>
                        <button type="button" className="text-xl text-destructive" onClick={() => handleDeleteAccount(acc.id, acc.account_name)}>
                          <div className="i-mdi-delete text-2xl" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="w-full py-3 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={handleAddAccount}>
            <div className="i-mdi-plus text-2xl mr-2" />添加公众号
          </button>
        </div>

        {/* === Push Settings === */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl text-foreground font-bold">推送设置</h2>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-xl text-foreground">启用推送</span>
            <button
              type="button"
              className={`w-14 h-8 flex items-center px-1 transition ${pushEnabled ? 'bg-accent' : 'bg-muted'}`}
              onClick={handleTogglePush}>
              <div className={`w-6 h-6 bg-card transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border">
            <span className="text-xl text-foreground">推送时间</span>
            <Picker mode="selector" range={timeOptions} value={timeOptions.indexOf(pushTime)} onChange={handleTimeChange}>
              <div className="flex items-center gap-2">
                <span className="text-xl text-accent">{pushTime}</span>
                <div className="i-mdi-chevron-right text-2xl text-muted-foreground" />
              </div>
            </Picker>
          </div>
          <button
            type="button"
            className="w-full py-3 flex items-center justify-center leading-none text-xl border border-input bg-card text-foreground transition"
            onClick={() => Taro.openSetting()}>
            <div className="i-mdi-cog text-2xl mr-2" />管理通知权限
          </button>
        </div>

        {/* === Data Source === */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl text-foreground font-bold">数据源</h2>
          <div
            className={`flex items-center gap-3 p-4 border ${dataSource === 'sogou' ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}
            onClick={() => setDataSource('sogou')}>
            <div className={`w-5 h-5 border flex items-center justify-center ${dataSource === 'sogou' ? 'bg-accent border-accent' : 'border-input'}`}>
              {dataSource === 'sogou' && <div className="i-mdi-check text-xl text-accent-foreground" />}
            </div>
            <div className="flex-1">
              <span className="text-xl text-foreground font-bold">搜狗微信搜索</span>
              <span className="text-base text-accent ml-2">免费</span>
            </div>
          </div>
          <div
            className={`flex items-center gap-3 p-4 border ${dataSource === 'third_party' ? 'border-accent bg-accent/5' : 'border-border bg-card'}`}
            onClick={() => setDataSource('third_party')}>
            <div className={`w-5 h-5 border flex items-center justify-center ${dataSource === 'third_party' ? 'bg-accent border-accent' : 'border-input'}`}>
              {dataSource === 'third_party' && <div className="i-mdi-check text-xl text-accent-foreground" />}
            </div>
            <div className="flex-1">
              <span className="text-xl text-foreground font-bold">第三方API</span>
              <span className="text-base text-destructive ml-2">付费</span>
            </div>
          </div>
          {dataSource === 'third_party' && (
            <div className="flex flex-col gap-2">
              <span className="text-xl text-foreground">API Key</span>
              <div className="border border-input bg-card px-4 py-3">
                <input
                  className="w-full text-xl text-foreground bg-transparent outline-none"
                  type="text"
                  placeholder="sk_test_xxxxxxxxxxxxx"
                  value={apiKey}
                  onInput={(e) => { const ev = e as any; setApiKey(ev.detail?.value ?? ev.target?.value ?? '') }}
                />
              </div>
            </div>
          )}
          <button
            type="button"
            className={`w-full py-3 flex items-center justify-center leading-none text-xl ${dsSaving ? 'bg-primary/50' : 'bg-primary'} text-primary-foreground transition`}
            onClick={handleSaveDataSource}>
            {dsSaving ? '保存中...' : '保存数据源配置'}
          </button>
        </div>

        {/* === Logout === */}
        <div className="flex flex-col gap-4 mt-4">
          <button
            type="button"
            className="w-full py-4 flex items-center justify-center leading-none text-xl border border-destructive text-destructive transition"
            onClick={handleSignOut}>
            退出登录
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 mt-8 mb-4">
          <span className="text-base text-muted-foreground">公众号内容聚合助手</span>
          <span className="text-sm text-muted-foreground">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default withRouteGuard(Settings)
