import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/productStore'

describe('productStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useProductStore()
    
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)
    expect(store.formState).toBeDefined()
    expect(store.formState.isConfirmed).toBe(false)
    expect(store.formState.sessionId).toBe(null)
  })

  it('should set confirmation', () => {
    const store = useProductStore()
    
    store.setConfirmation(true)
    expect(store.formState.isConfirmed).toBe(true)
    
    store.setConfirmation(false)
    expect(store.formState.isConfirmed).toBe(false)
  })

  it('should start a new session', () => {
    const store = useProductStore()
    
    store.startSession()
    expect(store.formState.sessionId).toBeTruthy()
    expect(typeof store.formState.sessionId).toBe('string')
    expect(store.formState.sessionId.startsWith('session-')).toBe(true)
  })

  it('should reset form state', () => {
    const store = useProductStore()
    
    store.setConfirmation(true)
    store.startSession()
    store.formState.savedProducts.push({ test: 'data' })
    
    store.resetForm()
    
    expect(store.formState.isConfirmed).toBe(false)
    expect(store.formState.sessionId).toBe(null)
    expect(store.formState.savedProducts.length).toBe(0)
  })

  it('should delete a product', () => {
    const store = useProductStore()
    
    store.formState.savedProducts.push({ test: 'product1' })
    store.formState.savedProducts.push({ test: 'product2' })
    
    expect(store.formState.savedProducts.length).toBe(2)
    
    store.deleteProduct(0)
    
    expect(store.formState.savedProducts.length).toBe(1)
    expect(store.formState.savedProducts[0].test).toBe('product2')
  })
})

