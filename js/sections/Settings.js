/**
 * Settings Section - App configuration with tabs
 * Uses new design system with Card, Button, Input components
 */

import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { Card } from '../components/Card.js'
import { Button } from '../components/Button.js'
import { Badge } from '../components/Badge.js'

let activeSection = 'general'

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'integrations', label: 'Integrations', icon: 'plug' },
  { id: 'data', label: 'Data & Backup', icon: 'save' }
]

export function createSettingsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function getStats() {
    const state = store.getState()
    const priorities = state.priorities || []
    const projects = state.projects || []
    const notes = state.notes || []

    const completed = priorities.filter(p => p.completed).length
    const total = priorities.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      completed,
      total,
      completionRate,
      projectCount: Array.isArray(projects) ? projects.length : Object.values(projects).flat().length,
      noteCount: notes.length
    }
  }

  function render() {
    const stats = getStats()
    const lastBackup = localStorage.getItem('mc_last_backup')

    container.innerHTML = `
      <div class="section-header">
        <div class="section-header__content">
          <h1 class="section-header__title">
            <i data-lucide="settings"></i> Settings
          </h1>
          <div class="section-header__badges">
            <span class="badge badge--neutral">Mission Control v5</span>
          </div>
        </div>
      </div>

      <div class="settings-layout" style="display: flex; gap: var(--space-6);">
        <div class="settings-nav-mobile" style="display: none;">
          <select class="form-select" onchange="window.setSettingsSection(this.value)">
            ${SETTINGS_SECTIONS.map(section => `
              <option value="${section.id}" ${activeSection === section.id ? 'selected' : ''}>
                ${section.label}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="settings-sidebar" style="min-width: 200px; display: flex; flex-direction: column; gap: var(--space-1);">
          ${SETTINGS_SECTIONS.map(section => `
            <button class="btn ${activeSection === section.id ? 'btn--primary' : 'btn--ghost'}"
              style="justify-content: flex-start;"
              onclick="window.setSettingsSection('${section.id}')"
            >
              <i data-lucide="${section.icon}"></i>
              <span>${section.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="settings-content" style="flex: 1;">
          ${renderActiveSection(stats, lastBackup)}
        </div>
      </div>
    `

    if (window.lucide) {
      window.lucide.createIcons()
    }
  }

  function renderActiveSection(stats, lastBackup) {
    switch (activeSection) {
      case 'general': return renderGeneralSettings(stats)
      case 'appearance': return renderAppearanceSettings()
      case 'integrations': return renderIntegrationsSettings()
      case 'data': return renderDataSettings(lastBackup)
      default: return renderGeneralSettings(stats)
    }
  }

  function renderGeneralSettings(stats) {
    const ordersTarget = store.get('ordersTarget') || 150
    const revenueGoal = store.get('revenueGoal') || 5400

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="bar-chart-3"></i> Your Stats</h3>
          </div>
          <div class="card__body">
            <div class="grid grid--4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-4);">
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.completed}</div>
                <div class="text-sm text-muted">Completed</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.completionRate}%</div>
                <div class="text-sm text-muted">Completion Rate</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.projectCount}</div>
                <div class="text-sm text-muted">Projects</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.noteCount}</div>
                <div class="text-sm text-muted">Notes</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="target"></i> Goals</h3>
          </div>
          <div class="card__body">
            <div class="form-group">
              <label class="form-label">Monthly Order Target</label>
              <div class="form-hint">Target number of orders per month</div>
              <input type="number" class="form-input" id="ordersTargetInput" value="${ordersTarget}" min="1" max="10000">
            </div>
            <div class="form-group">
              <label class="form-label">Revenue Goal</label>
              <div class="form-hint">Monthly revenue target ($)</div>
              <input type="number" class="form-input" id="revenueGoalInput" value="${revenueGoal}" min="0" max="1000000" step="100">
            </div>
            <button class="btn btn--primary" onclick="window.saveGoals()">
              <i data-lucide="save"></i> Save Goals
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="keyboard"></i> Keyboard Shortcuts</h3>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Press ? for help to show all keyboard shortcuts</p>
            <button class="btn btn--secondary" onclick="window.showShortcutsHelp()">Show Shortcuts</button>
          </div>
        </div>
      </div>
    `
  }

  function renderAppearanceSettings() {
    const currentTheme = localStorage.getItem('mc_theme') || 'dark'
    const isCompact = document.body.classList.contains('compact-mode')
    const reduceMotion = localStorage.getItem('mc_reduce_motion') === 'true'

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="palette"></i> Theme</h3>
          </div>
          <div class="card__body">
            <div class="form-group">
              <label class="form-label">Color Scheme</label>
              <div style="display: flex; gap: var(--space-2);">
                <button class="btn ${currentTheme === 'light' ? 'btn--primary' : 'btn--secondary'}"
