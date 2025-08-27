import { ApiError, BaseError, ChatboxAIAPIError, NetworkError } from '../models/errors'
import { parseJsonOrEmpty } from '../utils/json_utils'
import { isChatboxAPI } from './chatboxai_pool'

interface PlatformInfo {
  type: string
  platform: string
  os: string
  version: string
}

export function createAfetch(platformInfo: PlatformInfo) {
  return async function afetch(
    url: RequestInfo | URL,
    init?: RequestInit,
    options: {
      retry?: number
      parseChatboxRemoteError?: boolean
    } = {}
  ) {
    let requestError: BaseError | null = null
    const retry = options.retry || 0
    for (let i = 0; i < retry + 1; i++) {
      try {
        if (isChatboxAPI(url)) {
          init = {
            ...init,
            headers: {
              ...init?.headers,
              'CHATBOX-PLATFORM': platformInfo.platform,
              'CHATBOX-PLATFORM-TYPE': platformInfo.type,
              'CHATBOX-OS': platformInfo.os,
              'CHATBOX-VERSION': platformInfo.version,
            },
          }
        }
        const res = await fetch(url, init)
        // 状态码不在 200～299 之间，一般是接口报错了，这里也需要抛错后重试
        if (!res.ok) {
          const response = await res.text().catch((e) => '')
          if (options.parseChatboxRemoteError) {
            const errorCodeName = parseJsonOrEmpty(response)?.error?.code
            const chatboxAIError = ChatboxAIAPIError.fromCodeName(response, errorCodeName)
            if (chatboxAIError) {
              throw chatboxAIError
            }
          }
          throw new ApiError(`Status Code ${res.status}, ${response}`)
        }
        return res
      } catch (e) {
        if (e instanceof BaseError) {
          requestError = e
        } else {
          const err = e as Error
          let origin: string
          if (url instanceof Request) {
            origin = new URL(url.url).origin
          } else {
            origin = new URL(url).origin
          }
          requestError = new NetworkError(err.message, origin)
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    if (requestError) {
      throw requestError
    } else {
      throw new Error('Unknown error')
    }
  }
}

export async function uploadFile(file: File, url: string) {
  // COS 需要使用原始的 XMLHttpRequest（根据官网示例）
  // 如果使用 fetch，会导致上传的 excel、docx 格式不正确
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.upload.onprogress = () => {
      // do nothing
    }
    xhr.onload = () => {
      if (/^2\d\d$/.test(`${xhr.status}`)) {
        const ETag = xhr.getResponseHeader('etag')
        resolve({ url: url, ETag: ETag })
      } else {
        const error = new NetworkError(`XMLHttpRequest failed, status code ${xhr.status}`, '')
        reject(error)
      }
    }
    xhr.onerror = () => {
      const error = new NetworkError(`XMLHttpRequest failed, status code ${xhr.status}`, '')
      reject(error)
    }
    xhr.send(file)
  })
}
