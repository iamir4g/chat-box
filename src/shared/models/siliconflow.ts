import type { ProviderModelInfo } from '../types'
import type { ModelDependencies } from '../types/adapters'
import OpenAICompatible, { type OpenAICompatibleSettings } from './openai-compatible'

interface Options extends OpenAICompatibleSettings {}

export default class SiliconFlow extends OpenAICompatible {
  public name = 'SiliconFlow'
  public options: Options
  constructor(options: Omit<Options, 'apiHost'>, dependencies: ModelDependencies) {
    const apiHost = 'https://api.siliconflow.cn/v1'
    super(
      {
        apiKey: options.apiKey,
        apiHost,
        model: options.model,
        temperature: options.temperature,
        topP: options.topP,
        maxTokens: options.maxTokens,
        stream: options.stream,
      },
      dependencies
    )
    this.options = {
      ...options,
      apiHost,
    }
  }

  isSupportToolUse(scope?: 'web-browsing') {
    if (scope === 'web-browsing' && this.options.model.modelId.includes('deepseek')) {
      return false
    }
    return super.isSupportToolUse()
  }
}
