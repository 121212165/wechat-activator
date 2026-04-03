import {useState, useCallback, useEffect} from 'react'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from '@/contexts/AuthContext'
import {withRouteGuard} from '@/components/RouteGuard'
import {getTodayArticles, getKeywords, getAccounts} from '@/db/api'
import {supabase} from '@/client/supabase'
import type {ArticleWithDetails, Keyword} from '@/db/types'

function Home() {
  const {user} = useAuth()
  const [articles, setArticles] = useState<ArticleWithDetails[]>([])
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const [articlesData, keywordsData, accountsData] = await Promise.all([
      getTodayArticles(user.id),
      getKeywords(user.id),
      getAccounts(user.id)
    ])
    setArticles(articlesData)
    setKeywords(keywordsData)
    setLoading(false)

    // 检查是否需要引导用户配置
    if (keywordsData.length === 0 || accountsData.length === 0) {
      Taro.showModal({
        title: '提示',
        content: '请先前往配置页添加关键词和公众号',
        showCancel: false,
        confirmText: '去配置',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({url: '/pages/config/index'})
          }
        }
      })
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    
    // 先触发文章抓取
    try {
      const {error} = await supabase.functions.invoke('fetch_articles', {
        body: {user_id: user!.id}
      })
      
      if (error) {
        console.error('抓取文章失败:', error)
      }
    } catch (error) {
      console.error('抓取文章异常:', error)
    }
    
    // 然后刷新数据
    await loadData()
    setRefreshing(false)
    Taro.showToast({title: '刷新成功', icon: 'success', duration: 1500})
  }

  // 按关键词分组文章
  const groupedArticles = keywords.reduce(
    (acc, keyword) => {
      const keywordArticles = articles
        .filter((article) => article.keyword_id === keyword.id)
        .slice(0, 5) // 每个关键词最多5条
      acc[keyword.id] = {keyword, articles: keywordArticles}
      return acc
    },
    {} as Record<string, {keyword: Keyword; articles: ArticleWithDetails[]}>
  )

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    return '刚刚'
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
      {/* 刷新按钮 */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
        <button
          type="button"
          className={`flex items-center gap-2 text-xl text-foreground transition ${
            refreshing ? 'opacity-50' : ''
          }`}
          onClick={handleRefresh}>
          <div className={`i-mdi-refresh text-2xl ${refreshing ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="px-6 py-6">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="i-mdi-inbox text-6xl text-muted mb-4" />
            <span className="text-xl text-muted-foreground">暂无新消息</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {keywords.map((keyword) => {
              const group = groupedArticles[keyword.id]
              if (!group || group.articles.length === 0) return null

              return (
                <div key={keyword.id} className="flex flex-col gap-4">
                  {/* 关键词标题 */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl text-foreground font-bold">{keyword.keyword}</h2>
                    <span className="text-base text-muted-foreground">
                      {group.articles.length} 条
                    </span>
                  </div>

                  {/* 文章列表 */}
                  <div className="flex flex-col">
                    {group.articles.map((article, index) => (
                      <div key={article.id}>
                        <div
                          className="py-6 flex flex-col gap-3"
                          onClick={() => {
                            // 跳转到文章链接（小程序中需要使用web-view或复制链接）
                            Taro.setClipboardData({
                              data: article.link,
                              success: () => {
                                Taro.showToast({
                                  title: '链接已复制',
                                  icon: 'success',
                                  duration: 1500
                                })
                              }
                            })
                          }}>
                          {/* 标题 */}
                          <h3 className="text-xl text-foreground leading-relaxed">{article.title}</h3>

                          {/* 元信息 */}
                          <div className="flex items-center gap-3">
                            <span className="text-base text-muted-foreground">
                              {article.account?.account_name || '未知公众号'}
                            </span>
                            <span className="text-base text-muted-foreground">·</span>
                            <span className="text-base text-muted-foreground">
                              {formatTime(article.published_at)}
                            </span>
                          </div>

                          {/* 摘要 */}
                          <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
                            {article.summary}
                          </p>
                        </div>

                        {/* 分割线 */}
                        {index < group.articles.length - 1 && <div className="h-px bg-border" />}
                      </div>
                    ))}
                  </div>

                  {/* 关键词分组之间的分割 */}
                  {keyword.id !== keywords[keywords.length - 1]?.id && (
                    <div className="h-2 bg-muted" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default withRouteGuard(Home)
