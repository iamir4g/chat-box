import type { ProviderInfo, ProviderSettings } from 'src/shared/types'
import { ModelProviderEnum, ModelProviderType } from 'src/shared/types'
import { z } from 'zod'

const modelInfoSchema = z.object({
  modelId: z.string(),
  nickname: z.string().optional(),
  type: z.enum(['chat', 'embedding', 'rerank']).optional().default('chat'),
  capabilities: z.array(z.enum(['vision', 'reasoning', 'tool_use'])).optional(),
  contextWindow: z.number().optional(),
  maxOutput: z.number().optional(),
})

const BuiltinProviderConfigSchema = z.object({
  id: z.nativeEnum(ModelProviderEnum),
  settings: z.object({
    apiHost: z.string().optional(),
    apiKey: z.string(),
  }),
})

const providerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['openai', 'anthropic']),
  iconUrl: z.string().optional(),
  urls: z
    .object({
      website: z.string(),
      getApiKey: z.string().optional(),
      docs: z.string().optional(),
      models: z.string().optional(),
    })
    .optional(),
  settings: z.object({
    apiHost: z.string(),
    apiPath: z.string().optional(),
    apiKey: z.string().optional(),
    models: z.array(modelInfoSchema).optional(),
  }),
})

export type ProviderConfig = z.infer<typeof providerConfigSchema> | z.infer<typeof BuiltinProviderConfigSchema>

function parseBuiltinProviderConfig(json: unknown): (ProviderSettings & { id: ModelProviderEnum }) | undefined {
  const { data: parsed, success, error: parseError } = BuiltinProviderConfigSchema.safeParse(json)
  if (!success) {
    console.error('Builtin provider config validation failed:', parseError)
    return undefined
  }
  const providerSettings: ProviderSettings & { id: ModelProviderEnum } = {
    id: parsed.id,
    apiHost: parsed.settings.apiHost,
    apiKey: parsed.settings.apiKey,
  }
  return providerSettings
}

function parseProviderConfig(json: unknown): ProviderInfo | undefined {
  const { data: parsed, success, error: parseError } = providerConfigSchema.safeParse(json)
  if (!success) {
    console.error('Provider config validation failed:', parseError)
    return undefined
  }
  // Convert to ProviderInfo format
  const providerInfo: ProviderInfo = {
    id: parsed.id,
    name: parsed.name,
    type: parsed.type === 'openai' ? ModelProviderType.OpenAI : ModelProviderType.OpenAI, // Default to OpenAI for now
    urls: parsed.urls,
    iconUrl: parsed.iconUrl,

    apiHost: parsed.settings.apiHost,
    apiPath: parsed.settings.apiPath,
    apiKey: parsed.settings.apiKey,
    models: parsed.settings.models,
  }

  return providerInfo
}
export function parseProviderFromJson(
  text: string
): ProviderInfo | (ProviderSettings & { id: ModelProviderEnum }) | undefined {
  try {
    const json = JSON.parse(text)
    const provider = parseProviderConfig(json)
    if (provider) {
      return provider
    }
    const builtinProvider = parseBuiltinProviderConfig(json)
    if (builtinProvider) {
      return builtinProvider
    }
  } catch (err) {
    console.error('Failed to parse provider config:', err)
    return undefined
  }
}

export function validateProviderConfig(config: unknown): ProviderConfig | undefined {
  try {
    return providerConfigSchema.parse(config)
  } catch (err) {
    console.error('Provider config validation failed:', err)
    return undefined
  }
}
