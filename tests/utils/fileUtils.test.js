import { describe, it, expect } from 'vitest'
import { fileToBase64 } from '@/utils/fileUtils'

describe('fileUtils', () => {
  describe('fileToBase64', () => {
    it('should convert a file to base64', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const result = await fileToBase64(file)
      
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.startsWith('data:')).toBe(true)
    })

    it('should return null for null input', async () => {
      const result = await fileToBase64(null)
      expect(result).toBeNull()
    })

    it('should return null for undefined input', async () => {
      const result = await fileToBase64(undefined)
      expect(result).toBeNull()
    })
  })
})

