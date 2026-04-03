import {supabase} from '@/client/supabase'
import type {Profile, Keyword, Account, Article, ArticleWithDetails, PushRecord} from './types'

// ==================== Profile ====================

export async function getProfile(userId: string): Promise<Profile | null> {
  const {data, error} = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) {
    console.error('获取用户资料失败:', error)
    return null
  }
  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'push_enabled' | 'push_time'>>
): Promise<boolean> {
  const {error} = await supabase.from('profiles').update(updates).eq('id', userId)

  if (error) {
    console.error('更新用户资料失败:', error)
    return false
  }
  return true
}

// ==================== Keywords ====================

export async function getKeywords(userId: string): Promise<Keyword[]> {
  const {data, error} = await supabase
    .from('keywords')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取关键词列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function addKeyword(userId: string, keyword: string): Promise<Keyword | null> {
  const {data, error} = await supabase
    .from('keywords')
    .insert({user_id: userId, keyword})
    .select()
    .maybeSingle()

  if (error) {
    console.error('添加关键词失败:', error)
    return null
  }
  return data
}

export async function deleteKeyword(keywordId: string): Promise<boolean> {
  const {error} = await supabase.from('keywords').delete().eq('id', keywordId)

  if (error) {
    console.error('删除关键词失败:', error)
    return false
  }
  return true
}

// ==================== Accounts ====================

export async function getAccounts(userId: string): Promise<Account[]> {
  const {data, error} = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取公众号列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function addAccount(userId: string, accountName: string): Promise<Account | null> {
  const {data, error} = await supabase
    .from('accounts')
    .insert({user_id: userId, account_name: accountName})
    .select()
    .maybeSingle()

  if (error) {
    console.error('添加公众号失败:', error)
    return null
  }
  return data
}

export async function deleteAccount(accountId: string): Promise<boolean> {
  const {error} = await supabase.from('accounts').delete().eq('id', accountId)

  if (error) {
    console.error('删除公众号失败:', error)
    return false
  }
  return true
}

// ==================== Articles ====================

export async function getArticlesByUser(userId: string): Promise<ArticleWithDetails[]> {
  const {data, error} = await supabase
    .from('articles')
    .select(
      `
      *,
      keyword:keywords!articles_keyword_id_fkey(*),
      account:accounts!articles_account_id_fkey(*)
    `
    )
    .eq('user_id', userId)
    .order('published_at', {ascending: false})
    .limit(100)

  if (error) {
    console.error('获取文章列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function getTodayArticles(userId: string): Promise<ArticleWithDetails[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const {data, error} = await supabase
    .from('articles')
    .select(
      `
      *,
      keyword:keywords!articles_keyword_id_fkey(*),
      account:accounts!articles_account_id_fkey(*)
    `
    )
    .eq('user_id', userId)
    .gte('published_at', todayStr)
    .order('published_at', {ascending: false})

  if (error) {
    console.error('获取今日文章失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function addArticle(article: {
  user_id: string
  keyword_id: string
  account_id: string
  title: string
  summary: string
  link: string
  published_at: string
}): Promise<Article | null> {
  const {data, error} = await supabase.from('articles').insert(article).select().maybeSingle()

  if (error) {
    console.error('添加文章失败:', error)
    return null
  }
  return data
}

export async function deleteArticle(articleId: string): Promise<boolean> {
  const {error} = await supabase.from('articles').delete().eq('id', articleId)

  if (error) {
    console.error('删除文章失败:', error)
    return false
  }
  return true
}

// ==================== Push Records ====================

export async function getPushRecords(userId: string, limit = 10): Promise<PushRecord[]> {
  const {data, error} = await supabase
    .from('push_records')
    .select('*')
    .eq('user_id', userId)
    .order('pushed_at', {ascending: false})
    .limit(limit)

  if (error) {
    console.error('获取推送记录失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

export async function addPushRecord(userId: string, articleCount: number): Promise<PushRecord | null> {
  const {data, error} = await supabase
    .from('push_records')
    .insert({user_id: userId, article_count: articleCount})
    .select()
    .maybeSingle()

  if (error) {
    console.error('添加推送记录失败:', error)
    return null
  }
  return data
}
