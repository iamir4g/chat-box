import type { ModelInterface } from '../../../shared/models/types'
import type { Message } from '../../../shared/types'
import { convertToCoreMessages } from './message-utils'

export { streamText } from './stream-text'

export async function generateText(model: ModelInterface, messages: Message[]) {
  return model.chat(await convertToCoreMessages(messages), {})
}

export async function generateImage(
  model: ModelInterface,
  params: { prompt: string; num: number; signal?: AbortSignal; callback?: (picBase64: string) => void }
) {
  return model.paint(params.prompt, params.num, params.callback, params.signal)
}
