// Voice Input
// Speech-to-text for notes and forms

class VoiceInput {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.targetElement = null
    this.onResult = null
    this.onError = null
    
    this.init()
  }
  
  init() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported')
      return
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    
    this.recognition.onresult = (e) => this.handleResult(e)
    this.recognition.onerror = (e) => this.handleError(e)
    this.recognition.onend = () => this.handleEnd()
  }
  
  isSupported() {
    return this.recognition !== null
  }
  
  // Start listening
  start(targetElement, options = {}) {
    if (!this.isSupported()) {
      this.showNotSupported()
      return false
    }
    
    this.targetElement = targetElement
    this.onResult = options.onResult
    this.onError = options.onError
    this.onEnd = options.onEnd
    
    try {
      this.recognition.start()
      this.isListening = true
      this.showListeningIndicator()
      return true
    } catch (e) {
      console.error('Failed to start speech recognition:', e)
      return false
    }
  }
  
  // Stop listening
  stop() {
    if (!this.isListening || !this.recognition) return
    
    this.recognition.stop()
    this.isListening = false
    this.hideListeningIndicator()
  }
  
  // Toggle listening
  toggle(targetElement, options = {}) {
    if (this.isListening) {
      this.stop()
      return false
    } else {
      return this.start(targetElement, options)
    }
  }
  
  // Handle recognition result
  handleResult(event) {
    let finalTranscript = ''
    let interimTranscript = ''
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }
    
    // Update target element
    if (this.targetElement) {
      if (finalTranscript) {
        this.insertText(finalTranscript)
      }
      // Show interim text
      this.updateInterim(interimTranscript)
    }
    
    if (this.onResult) {
      this.onResult(finalTranscript, interimTranscript)
    }
  }
  
  // Handle errors
  handleError(event) {
    console.error('Speech recognition error:', event.error)
    
    const messages = {
      'no-speech': 'No speech detected. Try again.',
      'audio-capture': 'No microphone found.',
      'not-allowed': 'Microphone permission denied.',
      'network': 'Network error. Check your connection.',
      'aborted': 'Speech recognition aborted.'
    }
    
    const message = messages[event.error] || `Error: ${event.error}`
    
    if (this.onError) {
      this.onError(event.error, message)
    }
    
    this.hideListeningIndicator()
  }
  
  // Handle recognition end
  handleEnd() {
    this.isListening = false
    this.hideListeningIndicator()
    
    if (this.onEnd) {
      this.onEnd()
    }
  }
  
  // Insert text at cursor position
  insertText(text) {
    const el = this.targetElement
    
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const start = el.selectionStart
      const end = el.selectionEnd
      const value = el.value
      
      el.value = value.substring(0, start) + text + value.substring(end)
      el.selectionStart = el.selectionEnd = start + text.length
    } else if (el.isContentEditable) {
      document.execCommand('insertText', false, text)
    }
    
    // Trigger input event
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  
  // Update interim text display
  updateInterim(text) {
    // Could show interim text in a tooltip or overlay
    const indicator = document.getElementById('voice-indicator')
    if (indicator && text) {
      indicator.querySelector('.voice-text').textContent = text
    }
  }
  
  // Show listening indicator
  showListeningIndicator() {
    let indicator = document.getElementById('voice-indicator')
    
    if (!indicator) {
      indicator = document.createElement('div')
      indicator.id = 'voice-indicator'
      indicator.innerHTML = `
        <div class="voice-pulse">🎤</div>
        <span class="voice-text">Listening...</span>
        <button class="voice-stop">⏹️</button>
      `
      indicator.querySelector('.voice-stop').onclick = () => this.stop()
      document.body.appendChild(indicator)
    }
    
    indicator.classList.add('active')
  }
  
  // Hide listening indicator
  hideListeningIndicator() {
    const indicator = document.getElementById('voice-indicator')
    if (indicator) {
      indicator.classList.remove('active')
    }
  }
  
  // Show not supported message
  showNotSupported() {
    alert('Speech recognition is not supported in your browser. Try Chrome or Edge.')
  }
  
  // Create voice input button
  createButton(targetElement, options = {}) {
    if (!this.isSupported()) return null
    
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'voice-input-btn'
    btn.innerHTML = '🎤'
    btn.title = 'Voice input'
    
    btn.onclick = () => {
      const isListening = this.toggle(targetElement, options)
      btn.classList.toggle('listening', isListening)
    }
    
    return btn
  }
  
  // Add voice input to form field
  enhanceField(inputSelector, options = {}) {
    if (!this.isSupported()) return
    
    const inputs = document.querySelectorAll(inputSelector)
    inputs.forEach(input => {
      const wrapper = document.createElement('div')
      wrapper.className = 'voice-input-wrapper'
      
      input.parentNode.insertBefore(wrapper, input)
      wrapper.appendChild(input)
      
      const btn = this.createButton(input, options)
      if (btn) wrapper.appendChild(btn)
    })
  }
}

// Create singleton
export const voiceInput = new VoiceInput()

// Quick enhance function
export function enableVoiceInput(selector, options = {}) {
  voiceInput.enhanceField(selector, options)
}

export default voiceInput
