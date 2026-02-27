// Pomodoro timer and time tracking

import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'

class PomodoroTimer {
  constructor() {
    this.workTime = 25 * 60 // 25 minutes
    this.breakTime = 5 * 60 // 5 minutes
    this.longBreakTime = 15 * 60 // 15 minutes
    this.sessionsBeforeLongBreak = 4
    
    this.timeLeft = this.workTime
    this.isRunning = false
    this.isBreak = false
    this.sessionsCompleted = 0
    this.currentTask = null
    this.interval = null
    
    this.loadState()
  }
  
  loadState() {
    const saved = localStorage.getItem('pomodoro_state')
    if (saved) {
      const state = JSON.parse(saved)
      this.timeLeft = state.timeLeft || this.workTime
      this.sessionsCompleted = state.sessionsCompleted || 0
    }
  }
  
  saveState() {
    localStorage.setItem('pomodoro_state', JSON.stringify({
      timeLeft: this.timeLeft,
      sessionsCompleted: this.sessionsCompleted
    }))
  }
  
  /**
   * Start the timer
   */
  start(task = null) {
    if (this.isRunning) return
    
    this.currentTask = task
    this.isRunning = true
    
    toast.info(this.isBreak ? 'Break started' : 'Focus time!', 
               this.formatTime(this.timeLeft))
    
    this.interval = setInterval(() => {
      this.tick()
    }, 1000)
    
    this.updateDisplay()
  }
  
  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning) return
    
    this.isRunning = false
    clearInterval(this.interval)
    this.saveState()
    
    toast.info('Timer paused')
  }
  
  /**
   * Stop and reset
   */
  stop() {
    this.isRunning = false
    clearInterval(this.interval)
    this.timeLeft = this.isBreak ? this.breakTime : this.workTime
    this.saveState()
    this.updateDisplay()
  }
  
  /**
   * Tick every second
   */
  tick() {
    this.timeLeft--
    this.saveState()
    this.updateDisplay()
    
    if (this.timeLeft <= 0) {
      this.complete()
    }
  }
  
  /**
   * Timer completed
   */
  complete() {
    this.isRunning = false
    clearInterval(this.interval)
    
    if (this.isBreak) {
      // Break over, back to work
      this.isBreak = false
      this.timeLeft = this.workTime
      this.playSound('break-end')
      toast.success('Break over!', 'Time to focus')
    } else {
      // Work session complete
      this.sessionsCompleted++
      this.isBreak = true
      
      // Log time to current task
      if (this.currentTask) {
        this.logTimeToTask(this.currentTask, 25)
      }
      
      // Determine break length
      if (this.sessionsCompleted % this.sessionsBeforeLongBreak === 0) {
        this.timeLeft = this.longBreakTime
        toast.success('Long break!', 'Great work! Take 15 minutes.')
      } else {
        this.timeLeft = this.breakTime
        toast.success('Break time!', 'Take 5 minutes to recharge.')
      }
      
      this.playSound('session-complete')
    }
    
    this.saveState()
    this.updateDisplay()
    
    // Browser notification
    this.notify('Pomodoro Timer', this.isBreak ? 'Time for a break!' : 'Break is over!')
  }
  
  /**
   * Log time to a task
   */
  logTimeToTask(taskId, minutes) {
    const priorities = store.get('priorities') || []
    const priority = priorities.find(p => p.id === taskId)
    
    if (priority) {
      priority.timeSpent = (priority.timeSpent || 0) + minutes
      
      if (!priority.timeLog) priority.timeLog = []
      priority.timeLog.push({
        date: new Date().toISOString(),
        minutes,
        type: 'pomodoro'
      })
      
      store.set('priorities', priorities)
    }
  }
  
  /**
   * Format seconds to MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  /**
   * Update display if widget exists
   */
  updateDisplay() {
    const display = document.getElementById('pomodoroDisplay')
    if (display) {
      display.textContent = this.formatTime(this.timeLeft)
    }
    
    const status = document.getElementById('pomodoroStatus')
    if (status) {
      status.textContent = this.isBreak ? '☕ Break' : '🔥 Focus'
    }
    
    // Update page title
    if (this.isRunning) {
      document.title = `${this.formatTime(this.timeLeft)} - ${this.isBreak ? 'Break' : 'Focus'}`
    } else {
      document.title = 'Mission Control'
    }
  }
  
  /**
   * Play sound
   */
  playSound(type) {
    // Simple beep using Web Audio API
    try {
      const audio = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audio.createOscillator()
      const gainNode = audio.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audio.destination)
      
      if (type === 'session-complete') {
        // Happy completion sound
        oscillator.frequency.value = 523.25 // C5
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audio.currentTime + 0.2)
        
        setTimeout(() => {
          const osc2 = audio.createOscillator()
          osc2.connect(gainNode)
          osc2.frequency.value = 659.25 // E5
          osc2.start()
          osc2.stop(audio.currentTime + 0.2)
        }, 200)
      } else {
        // Simple beep
        oscillator.frequency.value = 440 // A4
        gainNode.gain.value = 0.2
        oscillator.start()
        oscillator.stop(audio.currentTime + 0.1)
      }
    } catch (e) {
      // Audio not supported
    }
  }
  
  /**
   * Browser notification
   */
  notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png'
      })
    }
  }
  
  /**
   * Request notification permission
   */
  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission()
    }
  }
  
  /**
   * Get stats
   */
  getStats() {
    const today = new Date().toISOString().split('T')[0]
    const priorities = store.get('priorities') || []
    
    let todayMinutes = 0
    let totalSessions = this.sessionsCompleted
    
    priorities.forEach(p => {
      if (p.timeLog) {
        p.timeLog.forEach(log => {
          if (log.date.startsWith(today)) {
            todayMinutes += log.minutes
          }
        })
      }
    })
    
    return {
      todayMinutes,
      totalSessions,
      currentStreak: Math.floor(this.sessionsCompleted / this.sessionsBeforeLongBreak)
    }
  }
}

export const pomodoro = new PomodoroTimer()

// Expose globally
window.pomodoro = pomodoro
