import platform from '@/platform'
import { tool } from 'ai'
import { z } from 'zod'

export const queryKnowledgeBaseTool = (kbId: number) => {
  return tool({
    description: 'Query a knowledge base',
    parameters: z.object({
      query: z.string().describe('The query to search the knowledge base'),
    }),
    execute: async ({ query }) => {
      const knowledgeBaseController = platform.getKnowledgeBaseController()
      return knowledgeBaseController.search(kbId, query)
    },
  })
}

export function getFilesMetaTool(knowledgeBaseId: number) {
  return tool({
    description: `Get metadata for files in the current knowledge base. Use this to find out more about files returned from a search, like filename, size, and total number of chunks.`,
    parameters: z.object({
      fileIds: z.array(z.number()).describe('An array of file IDs to get metadata for.'),
    }),
    execute: async ({ fileIds }) => {
      if (!fileIds || fileIds.length === 0) {
        return 'Please provide an array of file IDs.'
      }
      const knowledgeBaseController = platform.getKnowledgeBaseController()
      return knowledgeBaseController.getFilesMeta(knowledgeBaseId, fileIds)
    },
  })
}

export function readFileChunksTool(knowledgeBaseId: number) {
  return tool({
    description: `Read content chunks from specified files in the current knowledge base. Use this to get the text content of a document.`,
    parameters: z.object({
      chunks: z
        .array(
          z.object({
            fileId: z.number().describe('The ID of the file.'),
            chunkIndex: z.number().describe('The index of the chunk to read, start from 0.'),
          })
        )
        .describe('An array of file and chunk index pairs to read.'),
    }),
    execute: async ({ chunks }) => {
      if (!chunks || chunks.length === 0) {
        return 'Please provide an array of chunks to read.'
      }
      const knowledgeBaseController = platform.getKnowledgeBaseController()
      return knowledgeBaseController.readFileChunks(knowledgeBaseId, chunks)
    },
  })
}

export function listFilesTool(knowledgeBaseId: number) {
  return tool({
    description: `List all files in the current knowledge base. Returns file ID, filename, and chunk count for each file.`,
    parameters: z.object({
      page: z.number().describe('The page number to list, start from 0.'),
      pageSize: z.number().describe('The number of files to list per page.'),
    }),
    execute: async ({ page, pageSize }) => {
      const knowledgeBaseController = platform.getKnowledgeBaseController()
      const files = await knowledgeBaseController.listFilesPaginated(knowledgeBaseId, page, pageSize)
      return files
        .filter((file) => file.status === 'done')
        .map((file) => ({
          id: file.id,
          filename: file.filename,
          chunkCount: file.chunk_count || 0,
        }))
    },
  })
}

export function getToolSet(knowledgeBaseId: number) {
  return {
    query_knowledge_base: queryKnowledgeBaseTool(knowledgeBaseId),
    get_files_meta: getFilesMetaTool(knowledgeBaseId),
    read_file_chunks: readFileChunksTool(knowledgeBaseId),
    list_files: listFilesTool(knowledgeBaseId),
  }
}
