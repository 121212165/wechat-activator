-- 第三阶段修复：加强RLS安全性和数据完整性
-- 创建时间：2026-04-03
-- 修复问题：S-01 (RLS策略过于宽松), B-01 (边界校验缺失)

-- ==================== 增强 profiles 表安全性 ====================
-- 确保用户只能更新自己的非敏感字段
DROP POLICY IF EXISTS "用户可以更新自己的资料" ON profiles;
CREATE POLICY "用户可以更新自己的资料" ON profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
    openid IS NOT DISTINCT FROM (SELECT openid FROM profiles WHERE id = auth.uid())
  );

-- ==================== 增强 keywords 表安全性 ====================
-- 删除旧策略并重新创建更严格的策略
DROP POLICY IF EXISTS "用户可以查看自己的关键词" ON keywords;
DROP POLICY IF EXISTS "用户可以插入自己的关键词" ON keywords;
DROP POLICY IF EXISTS "用户可以删除自己的关键词" ON keywords;
DROP POLICY IF EXISTS "用户可以更新自己的关键词" ON keywords;

CREATE POLICY "用户可以查看自己的关键词" ON keywords
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的关键词" ON keywords
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND 
    LENGTH(TRIM(keyword)) > 0 AND 
    LENGTH(TRIM(keyword)) <= 50
  );

CREATE POLICY "用户可以更新自己的关键词" ON keywords
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND 
    LENGTH(TRIM(keyword)) > 0 AND 
    LENGTH(TRIM(keyword)) <= 50
  );

CREATE POLICY "用户可以删除自己的关键词" ON keywords
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- ==================== 增强 accounts 表安全性 ====================
DROP POLICY IF EXISTS "用户可以查看自己的公众号" ON accounts;
DROP POLICY IF EXISTS "用户可以插入自己的公众号" ON accounts;
DROP POLICY IF EXISTS "用户可以删除自己的公众号" ON accounts;
DROP POLICY IF EXISTS "用户可以更新自己的公众号" ON accounts;

CREATE POLICY "用户可以查看自己的公众号" ON accounts
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的公众号" ON accounts
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND 
    LENGTH(TRIM(account_name)) > 0 AND 
    LENGTH(TRIM(account_name)) <= 100
  );

CREATE POLICY "用户可以更新自己的公众号" ON accounts
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND 
    LENGTH(TRIM(account_name)) > 0 AND 
    LENGTH(TRIM(account_name)) <= 100
  );

CREATE POLICY "用户可以删除自己的公众号" ON accounts
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- ==================== 增强 articles 表安全性 ====================
DROP POLICY IF EXISTS "用户可以查看自己的文章" ON articles;
DROP POLICY IF EXISTS "用户可以插入自己的文章" ON articles;
DROP POLICY IF EXISTS "用户可以删除自己的文章" ON articles;

CREATE POLICY "用户可以查看自己的文章" ON articles
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的文章" ON articles
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = user_id AND 
    LENGTH(title) > 0 AND 
    LENGTH(title) <= 500 AND
    link IS NOT NULL
  );

CREATE POLICY "用户可以删除自己的文章" ON articles
  FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);

-- ==================== 增强 push_records 表安全性 ====================
DROP POLICY IF EXISTS "用户可以查看自己的推送记录" ON push_records;
DROP POLICY IF EXISTS "用户可以插入自己的推送记录" ON push_records;

CREATE POLICY "用户可以查看自己的推送记录" ON push_records
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的推送记录" ON push_records
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- ==================== 添加约束防止数据异常 ====================
-- 为 keywords 表添加唯一约束（同一用户不能有重复关键词）
ALTER TABLE keywords ADD CONSTRAINT unique_user_keyword UNIQUE (user_id, keyword);

-- 为 accounts 表添加唯一约束（同一用户不能有重复公众号）
ALTER TABLE accounts ADD CONSTRAINT unique_user_account UNIQUE (user_id, account_name);

-- 为 articles 表添加唯一约束（同一用户不能有重复链接的文章）
ALTER TABLE articles ADD CONSTRAINT unique_user_link UNIQUE (user_id, link);

-- ==================== 添加检查函数用于 Edge Function 验证 ====================
-- 创建验证关键词数量的函数
CREATE OR REPLACE FUNCTION check_keyword_limit(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) < 10 FROM keywords WHERE user_id = uid;
$$;

-- 创建验证公众号数量的函数
CREATE OR REPLACE FUNCTION check_account_limit(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) < 20 FROM accounts WHERE user_id = uid;
$$;

-- 创建获取用户关键词数量的函数
CREATE OR REPLACE FUNCTION get_keyword_count(uid uuid)
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM keywords WHERE user_id = uid;
$$;

-- 创建获取用户公众号数量的函数
CREATE OR REPLACE FUNCTION get_account_count(uid uuid)
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM accounts WHERE user_id = uid;
$$;

COMMENT ON FUNCTION check_keyword_limit IS '检查用户是否可以添加更多关键词（限制10个）';
COMMENT ON FUNCTION check_account_limit IS '检查用户是否可以添加更多公众号（限制20个）';
COMMENT ON FUNCTION get_keyword_count IS '获取用户当前关键词数量';
COMMENT ON FUNCTION get_account_count IS '获取用户当前公众号数量';
