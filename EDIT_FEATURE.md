# 关键词和公众号编辑功能说明

## 功能概述

v1.2.0版本新增了关键词和公众号的编辑功能，用户可以直接在配置页面修改已添加的关键词和公众号名称，无需删除后重新添加。

## 功能特性

### 1. 关键词编辑

**功能描述**：
- 点击关键词右侧的编辑图标（铅笔）进入编辑模式
- 修改关键词文本
- 点击勾选图标保存，或点击叉号取消

**使用场景**：
- 修正输入错误
- 调整关键词表述
- 优化搜索精度

**操作步骤**：
1. 进入"配置"页面
2. 找到需要修改的关键词
3. 点击右侧的编辑图标（铅笔）
4. 输入框会显示当前关键词文本
5. 修改文本内容
6. 点击勾选图标保存，或点击叉号取消

### 2. 公众号编辑

**功能描述**：
- 点击公众号右侧的编辑图标（铅笔）进入编辑模式
- 修改公众号名称
- 点击勾选图标保存，或点击叉号取消

**使用场景**：
- 修正公众号名称错误
- 更新公众号改名后的新名称
- 调整公众号名称格式

**操作步骤**：
1. 进入"配置"页面
2. 找到需要修改的公众号
3. 点击右侧的编辑图标（铅笔）
4. 输入框会显示当前公众号名称
5. 修改名称内容
6. 点击勾选图标保存，或点击叉号取消

## 界面设计

### 显示模式

```
┌─────────────────────────────────────────┐
│ 关键词管理                    3/10      │
├─────────────────────────────────────────┤
│ AI                      [编辑] [删除]   │
│ 科技                    [编辑] [删除]   │
│ 互联网                  [编辑] [删除]   │
└─────────────────────────────────────────┘
```

### 编辑模式

```
┌─────────────────────────────────────────┐
│ 关键词管理                    3/10      │
├─────────────────────────────────────────┤
│ [  AI  ]                [✓] [✗]        │
│ 科技                    [编辑] [删除]   │
│ 互联网                  [编辑] [删除]   │
└─────────────────────────────────────────┘
```

## 技术实现

### 数据库API

**文件**：`src/db/api.ts`

```typescript
// 更新关键词
export async function updateKeyword(keywordId: string, keyword: string): Promise<boolean> {
  const {error} = await supabase.from('keywords').update({keyword}).eq('id', keywordId)

  if (error) {
    console.error('更新关键词失败:', error)
    return false
  }
  return true
}

// 更新公众号
export async function updateAccount(accountId: string, accountName: string): Promise<boolean> {
  const {error} = await supabase.from('accounts').update({account_name: accountName}).eq('id', accountId)

  if (error) {
    console.error('更新公众号失败:', error)
    return false
  }
  return true
}
```

### 前端实现

**文件**：`src/pages/config/index.tsx`

**状态管理**：
```typescript
const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null)
const [editingKeywordText, setEditingKeywordText] = useState('')
const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
const [editingAccountText, setEditingAccountText] = useState('')
```

**编辑逻辑**：
```typescript
// 进入编辑模式
const handleEditKeyword = (keyword: Keyword) => {
  setEditingKeywordId(keyword.id)
  setEditingKeywordText(keyword.keyword)
}

// 保存编辑
const handleSaveKeyword = async () => {
  if (!editingKeywordText.trim()) {
    Taro.showToast({title: '关键词不能为空', icon: 'none'})
    return
  }

  const success = await updateKeyword(editingKeywordId!, editingKeywordText.trim())
  if (success) {
    Taro.showToast({title: '更新成功', icon: 'success'})
    setEditingKeywordId(null)
    setEditingKeywordText('')
    loadData()
  } else {
    Taro.showToast({title: '更新失败', icon: 'none'})
  }
}

// 取消编辑
const handleCancelEditKeyword = () => {
  setEditingKeywordId(null)
  setEditingKeywordText('')
}
```

**UI渲染**：
```typescript
{editingKeywordId === keyword.id ? (
  // 编辑模式
  <div className="flex-1 flex items-center gap-3">
    <div className="flex-1 border border-accent bg-card px-4 py-2 overflow-hidden">
      <input
        className="w-full text-xl text-foreground bg-transparent outline-none"
        type="text"
        value={editingKeywordText}
        onInput={(e) => {
          const ev = e as any
          setEditingKeywordText(ev.detail?.value ?? ev.target?.value ?? '')
        }}
      />
    </div>
    <button type="button" onClick={handleSaveKeyword}>
      <div className="i-mdi-check text-2xl" />
    </button>
    <button type="button" onClick={handleCancelEditKeyword}>
      <div className="i-mdi-close text-2xl" />
    </button>
  </div>
) : (
  // 显示模式
  <>
    <span className="text-xl text-foreground">{keyword.keyword}</span>
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => handleEditKeyword(keyword)}>
        <div className="i-mdi-pencil text-2xl" />
      </button>
      <button type="button" onClick={() => handleDeleteKeyword(keyword.id, keyword.keyword)}>
        <div className="i-mdi-delete text-2xl" />
      </button>
    </div>
  </>
)}
```

## 交互流程

### 关键词编辑流程

```
用户点击编辑图标
    ↓
进入编辑模式
    ↓
显示输入框，填充当前文本
    ↓
用户修改文本
    ↓
┌─────────────┬─────────────┐
│  点击保存   │  点击取消   │
└─────────────┴─────────────┘
    ↓               ↓
验证输入         恢复显示模式
    ↓
调用API更新
    ↓
显示结果提示
    ↓
刷新列表数据
    ↓
退出编辑模式
```

### 公众号编辑流程

与关键词编辑流程相同。

## 数据验证

### 输入验证

**关键词**：
- 不能为空
- 自动去除首尾空格
- 无长度限制（建议不超过20字符）

**公众号**：
- 不能为空
- 自动去除首尾空格
- 无长度限制（建议不超过30字符）

### 错误处理

**空输入**：
```typescript
if (!editingKeywordText.trim()) {
  Taro.showToast({title: '关键词不能为空', icon: 'none'})
  return
}
```

**更新失败**：
```typescript
if (success) {
  Taro.showToast({title: '更新成功', icon: 'success'})
} else {
  Taro.showToast({title: '更新失败', icon: 'none'})
}
```

## 用户体验优化

### 1. 即时反馈

- 点击编辑后立即进入编辑模式
- 保存成功后显示成功提示
- 更新失败后显示错误提示

### 2. 操作可撤销

- 提供取消按钮，可随时退出编辑模式
- 取消后恢复原始文本

### 3. 视觉区分

- 编辑模式下输入框有强调色边框（accent）
- 保存按钮使用强调色（绿色勾选）
- 取消按钮使用灰色（叉号）

### 4. 防误操作

- 编辑时其他项保持显示模式
- 同一时间只能编辑一个项
- 删除操作需要二次确认

## 最佳实践

### 1. 关键词命名

**推荐**：
- ✅ AI
- ✅ 人工智能
- ✅ 机器学习
- ✅ 深度学习

**不推荐**：
- ❌ AI人工智能机器学习（过长）
- ❌ ai（小写，搜索效果可能不佳）
- ❌ A I（有空格）

### 2. 公众号命名

**推荐**：
- ✅ 量子位
- ✅ 赛博禅心
- ✅ AI前线

**不推荐**：
- ❌ 量子位公众号（多余后缀）
- ❌ 量子位 （有空格）
- ❌ 量子位QbitAI（混合中英文）

### 3. 编辑时机

**建议编辑**：
- 发现输入错误
- 公众号改名
- 优化搜索效果

**不建议频繁编辑**：
- 已有文章数据关联到旧名称
- 频繁修改影响数据一致性

## 常见问题

### Q1: 编辑后历史文章会更新吗？

**答**：不会。编辑只影响新抓取的文章，历史文章仍保留原关键词/公众号名称。

### Q2: 可以同时编辑多个项吗？

**答**：不可以。同一时间只能编辑一个关键词或公众号，确保操作清晰。

### Q3: 编辑后需要重新抓取文章吗？

**答**：建议重新抓取。修改关键词或公众号名称后，下次刷新会使用新名称搜索。

### Q4: 编辑失败怎么办？

**答**：
1. 检查网络连接
2. 确认输入不为空
3. 重试操作
4. 如持续失败，尝试删除后重新添加

### Q5: 可以批量编辑吗？

**答**：当前版本不支持批量编辑，需要逐个修改。

## 未来优化方向

### 1. 批量编辑

- 支持选择多个项进行批量修改
- 提供批量导入/导出功能

### 2. 历史记录

- 记录编辑历史
- 支持撤销/重做操作

### 3. 智能建议

- 根据输入提供关键词建议
- 自动补全公众号名称

### 4. 数据同步

- 编辑后自动更新关联文章
- 提供数据迁移工具

## 技术支持

如有问题，请参考：
- 用户指南：`USER_GUIDE.md`
- 技术文档：`REAL_API_GUIDE.md`
- 快速开始：`QUICK_START.md`

---

© 2026 公众号内容聚合助手
