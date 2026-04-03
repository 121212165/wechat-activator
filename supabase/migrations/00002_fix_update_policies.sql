-- 修复关键词和公众号编辑权限问题
-- 添加UPDATE策略

-- 关键词表UPDATE策略
CREATE POLICY "用户可以更新自己的关键词" ON keywords
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 公众号表UPDATE策略
CREATE POLICY "用户可以更新自己的公众号" ON accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
