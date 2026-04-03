import {createClient} from 'jsr:@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 模拟文章数据
const mockArticles = [
  {
    title: 'GPT-5即将发布，多模态能力全面升级',
    summary: 'OpenAI宣布将在下月发布GPT-5，新版本将具备更强大的多模态理解能力，支持图像、视频、音频的综合处理。',
    link: 'https://example.com/article1'
  },
  {
    title: '量子计算取得重大突破，纠错能力提升10倍',
    summary: '中国科学院团队在量子计算领域取得重大突破，成功将量子纠错能力提升10倍，为实用化量子计算机铺平道路。',
    link: 'https://example.com/article2'
  },
  {
    title: '自动驾驶技术进入L4级商业化阶段',
    summary: '多家科技公司宣布其自动驾驶技术已进入L4级商业化阶段，预计明年将在多个城市推出无人驾驶出租车服务。',
    link: 'https://example.com/article3'
  },
  {
    title: '新型AI芯片能效比提升100倍',
    summary: '某芯片公司发布新一代AI专用芯片，采用全新架构设计，能效比相比上一代提升100倍，功耗降低80%。',
    link: 'https://example.com/article4'
  },
  {
    title: '脑机接口技术实现意念打字',
    summary: '最新研究表明，脑机接口技术已能实现每分钟90字的意念打字速度，为残障人士带来福音。',
    link: 'https://example.com/article5'
  }
]

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
    const {user_id} = await req.json().catch(() => ({}))
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

    // 为每个关键词和公众号组合生成模拟文章
    const articlesToInsert = []
    for (const keyword of keywords) {
      for (const account of accounts) {
        // 随机选择1-3篇文章
        const articleCount = Math.floor(Math.random() * 3) + 1
        for (let i = 0; i < articleCount && i < mockArticles.length; i++) {
          const mockArticle = mockArticles[i]
          articlesToInsert.push({
            user_id,
            keyword_id: keyword.id,
            account_id: account.id,
            title: `${mockArticle.title}`,
            summary: mockArticle.summary,
            link: mockArticle.link,
            published_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    }

    // 插入文章
    const {error: insertError} = await supabase.from('articles').insert(articlesToInsert)

    if (insertError) {
      return new Response(JSON.stringify({message: `插入文章失败: ${insertError.message}`}), {
        status: 500,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      })
    }

    return new Response(
      JSON.stringify({
        message: '文章抓取成功',
        articles_count: articlesToInsert.length
      }),
      {
        status: 200,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({message: error.message}), {
      status: 500,
      headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
    })
  }
})
