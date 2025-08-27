import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { ProviderModelInfo } from 'src/shared/types'
import type { ModelDependencies } from 'src/shared/types/adapters'
import AbstractAISDKModel from './abstract-ai-sdk'

type FetchFunction = typeof globalThis.fetch

interface Options {
  apiKey: string
  model: ProviderModelInfo
  temperature?: number
  topP?: number
  maxTokens?: number
  stream?: boolean
}

const Host = 'https://ark.cn-beijing.volces.com'
const Path = '/api/v3/chat/completions'

export default class VolcEngine extends AbstractAISDKModel {
  public name = 'VolcEngine'

  constructor(public options: Options, dependencies: ModelDependencies) {
    super(options, dependencies)
  }

  protected getCallSettings() {
    return {
      temperature: this.options.temperature,
      topP: this.options.topP,
      maxTokens: this.options.maxTokens,
    }
  }

  static isSupportTextEmbedding() {
    return true
  }

  protected getProvider() {
    return createOpenAICompatible({
      name: this.name,
      apiKey: this.options.apiKey,
      baseURL: Host,
      fetch: async (_input, init) => {
        return fetch(`${Host}${Path}`, init)
      },
    })
  }
  protected getChatModel() {
    const provider = this.getProvider()
    return provider.chatModel(this.options.model.modelId)
  }

  isSupportToolUse(scope?: 'web-browsing') {
    if (scope === 'web-browsing' && this.options.model.modelId.includes('deepseek')) {
      return false
    }
    return super.isSupportToolUse()
  }
}
