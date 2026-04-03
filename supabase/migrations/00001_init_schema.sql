-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 创建用户资料表
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  openid text,
  role user_role NOT NULL DEFAULT 'user',
  push_enabled boolean NOT NULL DEFAULT true,
  push_time text NOT NULL DEFAULT '18:00',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建关键词表
CREATE TABLE keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 创建公众号表
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 创建文章表
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword_id uuid NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  link text NOT NULL,
  published_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 创建推送记录表
CREATE TABLE push_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_count int NOT NULL DEFAULT 0,
  pushed_at timestamptz NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_keywords_user_id ON keywords(user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_keyword_id ON articles(keyword_id);
CREATE INDEX idx_articles_account_id ON articles(account_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_push_records_user_id ON push_records(user_id);

-- 创建用户同步函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
  extracted_username text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- 从邮箱中提取用户名（username@miaoda.com）
  extracted_username := CASE 
    WHEN NEW.email LIKE '%@miaoda.com' THEN split_part(NEW.email, '@', 1)
    ELSE NULL
  END;
  
  -- 插入用户资料
  INSERT INTO public.profiles (id, username, openid, role)
  VALUES (
    NEW.id,
    extracted_username,
    COALESCE((NEW.raw_user_meta_data->>'openid')::text, NULL),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'::user_role
  );
$$;

-- 设置RLS策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_records ENABLE ROW LEVEL SECURITY;

-- profiles表策略
CREATE POLICY "管理员可以查看所有用户资料" ON profiles
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的资料" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的资料" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()));

-- keywords表策略
CREATE POLICY "用户可以查看自己的关键词" ON keywords
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的关键词" ON keywords
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的关键词" ON keywords
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- accounts表策略
CREATE POLICY "用户可以查看自己的公众号" ON accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的公众号" ON accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的公众号" ON accounts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- articles表策略
CREATE POLICY "用户可以查看自己的文章" ON articles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的文章" ON articles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的文章" ON articles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- push_records表策略
CREATE POLICY "用户可以查看自己的推送记录" ON push_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的推送记录" ON push_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 插入初始数据（示例文章数据）
-- 注：由于无法直接访问公众号API，这里插入模拟数据供演示使用