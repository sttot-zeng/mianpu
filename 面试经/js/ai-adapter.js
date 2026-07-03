/* ===========================================
   ai-adapter.js — AI 适配器
   统一接口，支持多模型切换
   =========================================== */

const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    formatRequest(messages, model, opts) {
      return { model, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 4096 };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || '';
    }
  },
  qwen: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
    formatRequest(messages, model, opts) {
      return { model, input: { messages }, parameters: { temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 4096, result_format: 'message' } };
    },
    parseResponse(data) {
      return data.output?.choices?.[0]?.message?.content || data.output?.text || '';
    }
  },
  glm: {
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: ['glm-4', 'glm-4-plus', 'glm-4-flash'],
    formatRequest(messages, model, opts) {
      return { model, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 4096 };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || '';
    }
  },
  moonshot: {
    name: '月之暗面',
    baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    formatRequest(messages, model, opts) {
      return { model, messages, temperature: opts.temperature ?? 0.7, max_tokens: opts.maxTokens ?? 4096 };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || '';
    }
  }
};

class AIAdapter {
  constructor(config) {
    this.provider = config.provider || 'deepseek';
    this.apiKey = config.apiKey || '';
    this.model = config.model || PROVIDERS[this.provider]?.models[0] || '';
  }

  getProvider() {
    return PROVIDERS[this.provider];
  }

  getModels() {
    return this.getProvider()?.models || [];
  }

  async chat(messages, opts = {}) {
    const provider = this.getProvider();
    if (!provider) throw new Error(`Unknown provider: ${this.provider}`);
    if (!this.apiKey) throw new Error(`API key not configured for ${provider.name}`);

    const body = provider.formatRequest(messages, this.model, opts);
    const headers = { 'Content-Type': 'application/json' };

    // DeepSeek & Moonshot & GLM use Bearer token
    if (this.provider !== 'qwen') {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeout || 60000);

    try {
      const res = await fetch(provider.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      return provider.parseResponse(data);
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('AI 请求超时，请重试');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** 测试连接：发一条简单消息验证 API Key */
  async testConnection() {
    try {
      const r = await this.chat([{ role: 'user', content: '回复"ok"即可' }], { maxTokens: 10, timeout: 15000 });
      return { ok: true, message: r.slice(0, 50) };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }
}

// 从 storage 读取配置创建实例
function createAIFromSettings() {
  const settings = STORAGE.get(KEYS.SETTINGS, {});
  return new AIAdapter({
    provider: settings.aiProvider || 'deepseek',
    apiKey: settings.apiKey || '',
    model: settings.aiModel || ''
  });
}
