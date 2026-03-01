// Metric Card Component for Mission Control V5
// Modern metric cards with icons, values, and trend indicators

/**
 * Create a metric card with icon, value, trend indicator
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title
 * @param {string|number} options.value - Main value to display
 * @param {string} options.suffix - Optional suffix (e.g., "/ 10")
 * @param {string} options.icon - Lucide icon name (e.g., "bot", "zap", "check", "heart")
 * @param {number} options.trend - Trend value (positive, negative, or 0)
 * @param {string} options.trendLabel - Optional label for trend
 * @param {string} options.color - Color theme: 'purple', 'blue', 'green', 'amber'
 * @returns {string} HTML string for the metric card
 */
export function createMetricCard({ title, value, suffix, icon, trend, trendLabel, color = 'purple' }) {
  const trendIcon = trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'minus';
  const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral';
  const trendText = trendLabel || `${Math.abs(trend || 0)}%`;
  
  return `
    <div class="metric-card metric-card-${color}">
      <div class="metric-card-header">
        <div class="metric-card-icon">
          <i data-lucide="${icon}" class="lucide-icon"></i>
        </div>
        <div class="metric-card-trend ${trendClass}">
          <i data-lucide="${trendIcon}" class="lucide-icon trend-arrow"></i>
          <span>${trendText}</span>
        </div>
      </div>
      <div class="metric-card-value">
        ${value}${suffix ? `<span class="metric-card-suffix">${suffix}</span>` : ''}
      </div>
      <div class="metric-card-title">${title}</div>
    </div>
  `;
}

/**
 * Initialize Lucide icons in a container
 * @param {HTMLElement} container - Container element to search for icons
 */
export function initMetricCardIcons(container = document) {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        'stroke-width': 2
      },
      nameAttr: 'data-lucide'
    });
  }
}

/**
 * Create a metric card grid container
 * @param {string} cardsHtml - HTML string of metric cards
 * @returns {string} HTML string for the grid container
 */
export function createMetricCardGrid(cardsHtml) {
  return `
    <div class="dashboard-metrics-grid">
      ${cardsHtml}
    </div>
  `;
}
