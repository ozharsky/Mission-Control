// Unit Tests for Shared Utilities
import { test, assert } from './testUtils.js'
import {
  formatDate,
  formatCurrency,
  formatNumber,
  truncateText,
  generateId,
  deepClone,
  debounce,
  throttle
} from './shared.js'

// Date formatting tests
test('formatDate returns empty string for null', () => {
  assert.equal(formatDate(null), '')
  assert.equal(formatDate(undefined), '')
  assert.equal(formatDate(''), '')
})

test('formatDate formats short date correctly', () => {
  const result = formatDate('2026-02-26')
  assert.true(result.includes('Feb'))
  assert.true(result.includes('26'))
})

test('formatDate formats ISO date correctly', () => {
  const result = formatDate('2026-02-26', { format: 'iso' })
  assert.equal(result, '2026-02-26')
})

// Currency formatting tests
test('formatCurrency formats USD correctly', () => {
  const result = formatCurrency(1234.56)
  assert.true(result.includes('$'))
  assert.true(result.includes('1,234.56'))
})

test('formatCurrency handles zero', () => {
  const result = formatCurrency(0)
  assert.equal(result, '$0.00')
})

test('formatCurrency compact format works', () => {
  assert.equal(formatCurrency(1500, { compact: true }), '$1.5k')
  assert.equal(formatCurrency(1500000, { compact: true }), '$1.5M')
})

// Number formatting tests
test('formatNumber adds commas', () => {
  assert.equal(formatNumber(1000000), '1,000,000')
})

test('formatNumber compact format', () => {
  assert.equal(formatNumber(1500, { compact: true }), '1.5k')
})

// Text truncation tests
test('truncateText short text unchanged', () => {
  assert.equal(truncateText('hello', 100), 'hello')
})

test('truncateText long text truncated', () => {
  const result = truncateText('hello world', 8)
  assert.equal(result, 'hello...')
})

test('truncateText custom suffix', () => {
  const result = truncateText('hello world', 8, '..')
  assert.equal(result, 'hello ..')
})

// ID generation tests
test('generateId creates unique IDs', () => {
  const id1 = generateId()
  const id2 = generateId()
  assert.notEqual(id1, id2)
})

test('generateId includes prefix', () => {
  const id = generateId('test')
  assert.true(id.startsWith('test-'))
})

// Deep clone tests
test('deepClone clones objects', () => {
  const original = { a: 1, b: { c: 2 } }
  const cloned = deepClone(original)
  
  assert.equal(cloned.a, 1)
  assert.equal(cloned.b.c, 2)
  
  // Modify clone shouldn't affect original
  cloned.b.c = 3
  assert.equal(original.b.c, 2)
})

test('deepClone clones arrays', () => {
  const original = [1, 2, [3, 4]]
  const cloned = deepClone(original)
  
  assert.length(cloned, 3)
  assert.length(cloned[2], 2)
})

// Debounce tests
test('debounce delays execution', async () => {
  let count = 0
  const debounced = debounce(() => count++, 50)
  
  debounced()
  debounced()
  debounced()
  
  assert.equal(count, 0) // Should not execute immediately
  
  await new Promise(r => setTimeout(r, 100))
  assert.equal(count, 1) // Should execute once after delay
})

// Throttle tests
test('throttle limits execution', async () => {
  let count = 0
  const throttled = throttle(() => count++, 100)
  
  throttled()
  throttled()
  throttled()
  
  assert.equal(count, 1) // Should execute immediately
  
  await new Promise(r => setTimeout(r, 150))
  throttled()
  assert.equal(count, 2) // Should execute after throttle period
})

console.log('[Test] Unit tests loaded')
