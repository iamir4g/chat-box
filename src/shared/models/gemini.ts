import { createGoogleGenerativeAI, type GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import type { LanguageModelV1 } from 'ai'
import type { ProviderModelInfo } from '../types'
import type { ModelDependencies } from '../types/adapters'
import { normalizeGeminiHost } from '../utils/llm_utils'
import AbstractAISDKModel, { type CallSettings } from './abstract-ai-sdk'
import { ApiError } from './errors'
import type { CallChatCompletionOptions } from './types'

interface Options {
  geminiAPIKey: string
  geminiAPIHost: string
  model: ProviderModelInfo
  temperature?: number
  topP?: number
  maxTokens?: number
  stream?: boolean
}

export default class Gemeni extends AbstractAISDKModel {
  public name = 'Google Gemini'

  constructor(public options: Options, dependencies: ModelDependencies) {
    super(options, dependencies)
    this.injectDefaultMetadata = false
  }

  isSupportSystemMessage() {
    return !['gemini-2.0-flash-exp', 'gemini-2.0-flash-thinking-exp', 'gemini-2.0-flash-exp-image-generation'].includes(
      this.options.model.modelId
    )
  }

  protected getProvider() {
    return createGoogleGenerativeAI({
      apiKey: this.options.geminiAPIKey,
      baseURL: normalizeGeminiHost(this.options.geminiAPIHost).apiHost,
    })
  }

  protected getChatModel(options: CallChatCompletionOptions): LanguageModelV1 {
    const provider = this.getProvider()

    return provider.chat(this.options.model.modelId, {
      structuredOutputs: false,
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      ],
    })
  }

  protected getCallSettings(options: CallChatCompletionOptions): CallSettings {
    const isModelSupportThinking = this.isSupportReasoning()
    let providerParams = {} as GoogleGenerativeAIProviderOptions
    if (isModelSupportThinking) {
      providerParams = {
        ...(options.providerOptions?.google || {}),
        thinkingConfig: {
          ...(options.providerOptions?.google?.thinkingConfig || {}),
          includeThoughts: true,
        },
      }
    }

    const settings: CallSettings = {
      maxTokens: this.options.maxTokens,
      providerOptions: {
        google: {
          ...providerParams,
        } satisfies GoogleGenerativeAIProviderOptions,
      },
    }
    if (['gemini-2.0-flash-preview-image-generation'].includes(this.options.model.modelId)) {
      settings.providerOptions = {
        google: {
          ...providerParams,
          responseModalities: ['TEXT', 'IMAGE'],
        } satisfies GoogleGenerativeAIProviderOptions,
      }
    }
    return settings
  }

  async listModels(): Promise<string[]> {
    // https://ai.google.dev/api/models#method:-models.list
    type Response = {
      models: {
        name: string
        version: string
        displayName: string
        description: string
        inputTokenLimit: number
        outputTokenLimit: number
        supportedGenerationMethods: string[]
        temperature: number
        topP: number
        topK: number
      }[]
    }
    const res = await this.dependencies.request.apiRequest({
      url: `${this.options.geminiAPIHost}/v1beta/models?key=${this.options.geminiAPIKey}`,
      method: 'GET',
      headers: {}
    })
    const json: Response = await res.json()
    if (!json['models']) {
      throw new ApiError(JSON.stringify(json))
    }
    return json['models']
      .filter((m) => m['supportedGenerationMethods'].some((method) => method.includes('generate')))
      .filter((m) => m['name'].includes('gemini'))
      .map((m) => m['name'].replace('models/', ''))
      .sort()
  }
}
