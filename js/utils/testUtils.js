// Test Utilities and Basic Unit Tests
// Simple testing framework for Mission Control

class TestRunner {
  constructor() {
    this.tests = []
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    }
  }
  
  // Register a test
  test(name, fn) {
    this.tests.push({ name, fn })
  }
  
  // Run all tests
  async runAll() {
    console.log('[Test] Running tests...\n')
    
    for (const { name, fn } of this.tests) {
      try {
        await fn()
        this.results.passed++
        console.log(`[PASS] ${name}`)
      } catch (error) {
        this.results.failed++
        this.results.errors.push({ name, error })
        console.error(`[FAIL] ${name}`)
        console.error(`   ${error.message}`)
      }
    }
    
    this.printSummary()
    return this.results
  }
  
  printSummary() {
    const total = this.results.passed + this.results.failed
    console.log(`\n[Test Results] ${this.results.passed}/${total} passed`)
    
    if (this.results.failed > 0) {
      console.log(`\n[FAIL] ${this.results.failed} test(s) failed`)
    }
  }
}

// Assertion helpers
export const assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`)
    }
  },
  
  notEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected values to be different`)
    }
  },
  
  true(value, message) {
    if (value !== true) {
      throw new Error(message || `Expected true, got ${value}`)
    }
  },
  
  false(value, message) {
    if (value !== false) {
      throw new Error(message || `Expected false, got ${value}`)
    }
  },
  
  null(value, message) {
    if (value !== null) {
      throw new Error(message || `Expected null, got ${value}`)
    }
  },
  
  notNull(value, message) {
    if (value === null || value === undefined) {
      throw new Error(message || `Expected non-null value`)
    }
  },
  
  undefined(value, message) {
    if (value !== undefined) {
      throw new Error(message || `Expected undefined, got ${value}`)
    }
  },
  
  defined(value, message) {
    if (value === undefined) {
      throw new Error(message || `Expected defined value`)
    }
  },
  
  throws(fn, message) {
    let threw = false
    try {
      fn()
    } catch (e) {
      threw = true
    }
    if (!threw) {
      throw new Error(message || `Expected function to throw`)
    }
  },
  
  async throwsAsync(fn, message) {
    let threw = false
    try {
      await fn()
    } catch (e) {
      threw = true
    }
    if (!threw) {
      throw new Error(message || `Expected async function to throw`)
    }
  },
  
  includes(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to include ${item}`)
    }
  },
  
  length(array, expected, message) {
    if (array.length !== expected) {
      throw new Error(message || `Expected length ${expected}, got ${array.length}`)
    }
  },
  
  match(string, regex, message) {
    if (!regex.test(string)) {
      throw new Error(message || `Expected string to match ${regex}`)
    }
  }
}

// Create test runner instance
export const runner = new TestRunner()

// Export test function
export function test(name, fn) {
  runner.test(name, fn)
}

// Export run function
export function runTests() {
  return runner.runAll()
}

// Auto-run tests in development
if (import.meta.env?.DEV || location.hostname === 'localhost') {
  // Tests will be registered by other modules
  setTimeout(() => {
    if (runner.tests.length > 0) {
      runTests()
    }
  }, 1000)
}
