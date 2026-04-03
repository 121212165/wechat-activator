# 部署操作指南

**项目**：app-apbcv7yhhuyp  
**版本**：v1.2.2  
**日期**：2026-04-03

---

## 待执行操作

你需要手动执行以下两个操作来修复问题：

### 操作1：执行数据库迁移（修复编辑问题）

在 **Supabase Dashboard** 中执行：
- 打开 https://supabase.com/dashboard
- 选择项目 `appmiaoda` 或 `miaoda`
- 进入 **SQL Editor**
- 复制粘贴以下SQL并执行：

```sql
-- 关键词表UPDATE策略
CREATE POLICY "用户可以更新自己的关键词" ON keywords
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 公众号表UPDATE策略
CREATE POLICY "用户可以更新自己的公众号" ON accounts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
```

**验证**：执行后应该显示 "Policy created successfully"

---

### 操作2：部署Edge Function（修复搜狗抓取）

需要在安装了 Supabase CLI 的环境中执行：

```bash
cd app-apbcv7yhhuyp
supabase functions deploy fetch_articles_real
```

如果没有本地 CLI，可以：
1. 在 GitHub Codespaces 中执行
2. 或使用 GitHub Actions 部署

---

## 修复完成后的测试用例

### 测试1：编辑关键词
1. 登录小程序
2. 进入「配置」页面
3. 点击任意关键词的编辑图标（铅笔）
4. 修改文本
5. 点击保存图标（勾选）
6. **预期**：显示"更新成功"

### 测试2：编辑公众号
1. 在配置页向下滚动
2. 点击任意公众号的编辑图标
3. 修改名称
4. 点击保存
5. **预期**：显示"更新成功"

### 测试3：搜狗抓取
1. 进入「简报」页面
2. 点击「刷新」按钮
3. 等待10秒
4. **预期**：显示文章列表（非模拟数据）

---

## 状态更新

完成操作后请告诉我，我会更新测试记录。