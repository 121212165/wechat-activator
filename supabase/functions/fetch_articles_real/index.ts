import {createClient} from 'jsr:@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 时间过滤：只获取最近7天的文章
const DAYS_FILTER = 7

// 搜狗微信搜索API
async function searchSogouWeixin(keyword: string, accountName: string): Promise<any[]> {
  try {
    // 搜狗微信搜索URL
    const searchUrl = `https://weixin.sogou.com/weixin?type=2&query=${encodeURIComponent(
      keyword + ' ' + accountName
    )}`

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    })

    if (!response.ok) {
      console.error('搜狗微信搜索请求失败:', response.status)
      return []
    }

    const html = await response.text()

    // 解析HTML获取文章列表
    const articles = parseArticlesFromHTML(html)
    return articles.slice(0, 5) // 最多返回5条
  } catch (error) {
    console.error('搜狗微信搜索异常:', error)
    return []
  }
}

// 解析HTML获取文章信息
function parseArticlesFromHTML(html: string): any[] {
  const articles: any[] = []

  try {
    // 方法1: 尝试新的结构 - 使用通用链接和标题模式
    // 搜狗新版页面可能使用不同的结构

    // 提取所有包含文章链接的内容块
    const blockRegex = /<a[^>]*href="([^"]*\.html)"[^>]*>([^<]*)<\/a>/gi
    const blockMatches = [...html.matchAll(blockRegex)]

    for (const match of blockMatches) {
      const link = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()

      // 过滤非文章链接
      if (!link || !title || title.length < 5) continue
      if (title.includes('查看更多') || title.includes('相关搜索')) continue

      // 获取该标题附近的摘要和时间
      const titlePos = html.indexOf(match[0])
      const contextStart = Math.max(0, titlePos - 200)
      const contextEnd = Math.min(html.length, titlePos + 500)
      const context = html.slice(contextStart, contextEnd)

      // 尝试提取摘要 - 查找<p>标签
      let summary = '暂无摘要'
      const pMatch = context.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
      if (pMatch) {
        summary = pMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 200)
      }

      // 尝试提取时间
      let publishedAt = new Date().toISOString()
      const timeMatch = context.match(/(\d+)小时前|(\d+)天前|(\d+)分钟前/i)
      if (timeMatch) {
        publishedAt = parsePublishTime(timeMatch[0])
      }

      articles.push({
        title,
        summary: summary || '暂无摘要',
        link: link.startsWith('http') ? link : `https://weixin.sogou.com${link}`,
        published_at: publishedAt
      })
    }

    // 方法2: 如果方法1没有返回结果，尝试备用结构
    if (articles.length === 0) {
      // 提取article-box或news-list中的内容
      const altRegex = /<article[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>[\s\S]*?<p[^>]*>([^<]*)<\/p>/gi
      const altMatches = [...html.matchAll(altRegex)]

      for (const match of altMatches) {
        const link = match[1]
        const title = match[2].trim()
        const summary = match[3].trim()

        if (title && title.length > 5) {
          articles.push({
            title,
            summary: summary.substring(0, 200),
            link: link.startsWith('http') ? link : `https://weixin.sogou.com${link}`,
            published_at: new Date().toISOString()
          })
        }
      }
    }

    // 方法3: 简单的通用提取作为最后后备
    if (articles.length === 0) {
      const simpleRegex = /["'](https?:\/\/[^"']+\.html)["'][^>]*>([^<]{10,100})/g
      const simpleMatches = [...html.matchAll(simpleRegex)]

      for (const match of simpleMatches) {
        const link = match[1]
        const title = match[2].trim()

        if (title && !title.includes('<img')) {
          articles.push({
            title,
            summary: '暂无摘要',
            link,
            published_at: new Date().toISOString()
          })
        }
      }
    }

    // 去重
    const seen = new Set<string>()
    const uniqueArticles = articles.filter((a) => {
      if (seen.has(a.title)) return false
      seen.add(a.title)
      return true
    })

    return uniqueArticles.slice(0, 10)
  } catch (error) {
    console.error('解析HTML失败:', error)
  }

  return articles
}

// 转义正则表达式特殊字符
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 解析发布时间
function parsePublishTime(timeStr: string): string {
  try {
    const now = new Date()

    // 处理"X小时前"、"X天前"等格式
    if (timeStr.includes('小时前')) {
      const hours = parseInt(timeStr)
      return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()
    } else if (timeStr.includes('天前')) {
      const days = parseInt(timeStr)
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeStr.includes('分钟前')) {
      const minutes = parseInt(timeStr)
      return new Date(now.getTime() - minutes * 60 * 1000).toISOString()
    } else {
      // 默认返回当前时间
      return now.toISOString()
    }
  } catch (error) {
    return new Date().toISOString()
  }
}

// 第三方API接口（预留）
async function fetchFromThirdPartyAPI(
  keyword: string,
  accountName: string,
  apiKey?: string
): Promise<any[]> {
  // 这里可以接入第三方API服务，如新榜、清博等
  // 示例代码：
  /*
  const response = await fetch('https://api.example.com/articles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ keyword, account: accountName })
  })
  
  const data = await response.json()
  return data.articles
  */

  console.log('第三方API功能暂未实现')
  return []
}

Deno.serve(async (req) => {
  // 处理CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    const {user_id, use_third_party_api = false} = await req.json().catch(() => ({}))
    if (!user_id) {
      return new Response(JSON.stringify({message: '缺少user_id'}), {
        status: 400,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      })
    }

    // 获取用户的关键词和公众号
    const {data: keywords} = await supabase.from('keywords').select('*').eq('user_id', user_id)

    const {data: accounts} = await supabase.from('accounts').select('*').eq('user_id', user_id)

    if (!keywords || keywords.length === 0 || !accounts || accounts.length === 0) {
      return new Response(
        JSON.stringify({message: '请先添加关键词和公众号', articles_count: 0}),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }

    // 获取第三方API密钥（如果使用）
    const thirdPartyApiKey = use_third_party_api ? Deno.env.get('THIRD_PARTY_API_KEY') : undefined

    // 为每个关键词和公众号组合抓取文章
    const articlesToInsert = []
    let successCount = 0
    let failCount = 0

    // 获取用户最近7天的文章标题（用于去重）
    const sevenDaysAgo = new Date(Date.now() - DAYS_FILTER * 24 * 60 * 60 * 1000).toISOString()
    const {data: existingArticles} = await supabase
      .from('articles')
      .select('title, link')
      .eq('user_id', user_id)
      .gte('created_at', sevenDaysAgo)

    const existingTitles = new Set<string>()
    const existingLinks = new Set<string>()
    if (existingArticles) {
      existingArticles.forEach((a) => {
        existingTitles.add(a.title)
        if (a.link) existingLinks.add(a.link)
      })
    }

    for (const keyword of keywords) {
      for (const account of accounts) {
        try {
          // 选择数据源
          const articles = use_third_party_api
            ? await fetchFromThirdPartyAPI(keyword.keyword, account.account_name, thirdPartyApiKey)
            : await searchSogouWeixin(keyword.keyword, account.account_name)

          if (articles.length > 0) {
            successCount++
            for (const article of articles) {
              // 检查是否重复（标题或链接）
              const isDuplicate =
                existingTitles.has(article.title) ||
                (article.link && existingLinks.has(article.link))

              if (!isDuplicate) {
                // 检查发布时间是否在7天内
                const publishedAt = new Date(article.published_at)
                const isRecent = publishedAt >= new Date(sevenDaysAgo)

                if (isRecent) {
                  articlesToInsert.push({
                    user_id,
                    keyword_id: keyword.id,
                    account_id: account.id,
                    title: article.title,
                    summary: article.summary,
                    link: article.link,
                    published_at: article.published_at
                  })
                  // 添加到去重集合
                  existingTitles.add(article.title)
                  if (article.link) existingLinks.add(article.link)
                }
              }
            }
          } else {
            failCount++
          }

          // 添加延迟，避免请求过快被封禁
          await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`抓取失败 [${keyword.keyword} - ${account.account_name}]:`, error)
          failCount++
        }
      }
    }

    // 插入文章
    if (articlesToInsert.length > 0) {
      const {error: insertError} = await supabase.from('articles').insert(articlesToInsert)

      if (insertError) {
        return new Response(JSON.stringify({message: `插入文章失败: ${insertError.message}`}), {
          status: 500,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        })
      }

      return new Response(
        JSON.stringify({
          message: '文章抓取完成',
          articles_count: articlesToInsert.length,
          success_count: successCount,
          fail_count: failCount,
          data_source: use_third_party_api ? 'third_party_api' : 'sogou_weixin'
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          message: '未抓取到新文章',
          articles_count: 0,
          success_count: successCount,
          fail_count: failCount
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }
  } catch (error) {
    return new Response(JSON.stringify({message: error.message}), {
      status: 500,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
    })
  }
})
