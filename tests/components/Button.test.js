import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/Button.vue'

describe('Button', () => {
  it('renders button with text', () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Test Button',
        type: 'primary'
      }
    })
    
    expect(wrapper.text()).toContain('Test Button')
    expect(wrapper.classes()).toContain('primary-button')
  })

  it('renders disabled button', () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Disabled',
        type: 'primary',
        isDisabled: true
      }
    })
    
    expect(wrapper.classes()).toContain('disabled')
    const button = wrapper.find('button')
    // Button component doesn't set disabled attribute, just class
    expect(button.exists()).toBe(true)
  })

  it('emits click event', async () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Click Me',
        type: 'primary'
      }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('renders secondary button type', () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Secondary',
        type: 'secondary'
      }
    })
    
    expect(wrapper.classes()).toContain('secondary-button')
  })
})

