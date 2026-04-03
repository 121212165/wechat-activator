// 数据库类型定义

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string | null
  openid: string | null
  role: UserRole
  push_enabled: boolean
  push_time: string
  created_at: string
  updated_at: string
}

export interface Keyword {
  id: string
  user_id: string
  keyword: string
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  account_name: string
  created_at: string
}

export interface Article {
  id: string
  user_id: string
  keyword_id: string
  account_id: string
  title: string
  summary: string
  link: string
  published_at: string
  created_at: string
}

export interface PushRecord {
  id: string
  user_id: string
  article_count: number
  pushed_at: string
}

// 文章列表项（包含关联信息）
export interface ArticleWithDetails extends Article {
  keyword?: Keyword
  account?: Account
}
