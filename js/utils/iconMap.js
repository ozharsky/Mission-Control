/**
 * Emoji to Lucide Icon Mapping
 * Use this to replace emojis with consistent Lucide icons
 */

export const iconMap = {
  // Common actions
  '➕': 'plus',
  '✅': 'check',
  '✓': 'check',
  '✕': 'x',
  '❌': 'x',
  '📝': 'file-text',
  '📌': 'pin',
  '✏️': 'pencil',
  '🗑️': 'trash-2',
  '🔍': 'search',
  '📊': 'bar-chart-2',
  '📈': 'trending-up',
  '📉': 'trending-down',
  
  // Navigation
  '☰': 'menu',
  '◀': 'chevron-left',
  '▶': 'chevron-right',
  '▼': 'chevron-down',
  '▲': 'chevron-up',
  
  // Files & Folders
  '📁': 'folder',
  '📂': 'folder-open',
  '📄': 'file',
  '📑': 'copy',
  '📥': 'download',
  '📤': 'upload',
  
  // Business
  '💰': 'dollar-sign',
  '🎯': 'target',
  '🏢': 'building-2',
  '🏪': 'store',
  '🛒': 'shopping-cart',
  '📸': 'camera',
  '🖨️': 'printer',
  '📦': 'package',
  
  // Status
  '⭐': 'star',
  '🔥': 'flame',
  '⚡': 'zap',
  '☀️': 'sun',
  '🌙': 'moon',
  '💻': 'monitor',
  '🔔': 'bell',
  '🔌': 'plug',
  '💾': 'save',
  '⌨️': 'keyboard',
  
  // Time
  '📅': 'calendar',
  '🕐': 'clock',
  '⏰': 'alarm-clock',
  '⏳': 'hourglass',
  '🔄': 'refresh-cw',
  
  // People
  '👤': 'user',
  '👥': 'users',
  '🤖': 'bot',
  
  // Communication
  '📧': 'mail',
  '🔗': 'link',
  '💡': 'lightbulb',
  '📍': 'map-pin',
  
  // Categories
  '🌿': 'leaf',
  '🎨': 'palette',
  '⚙️': 'settings',
  '🐙': 'github',
  '🎉': 'party-popper',
  '🏷️': 'tag',
  '🔒': 'lock',
  '🔓': 'unlock',
  '📋': 'clipboard-list',
  '📎': 'paperclip',
  '🌐': 'globe',
  '📘': 'book',
  
  // Arrows
  '⏸': 'pause',
  '⏹': 'square',
  
  // Misc
  '❓': 'help-circle',
  '⚠️': 'alert-triangle',
  '🆕': 'badge',
  '📖': 'book-open',
  'B': 'bold',
  'I': 'italic',
  'H': 'heading',
  '•': 'list',
  '</>': 'code'
};

/**
 * Replace emojis in text with Lucide icon HTML
 * @param {string} text - Text that may contain emojis
 * @returns {string} HTML with Lucide icons
 */
export function replaceEmojisWithIcons(text) {
  if (!text) return '';
  
  let result = text;
  for (const [emoji, iconName] of Object.entries(iconMap)) {
    const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, `<i data-lucide="${iconName}" class="lucide-icon"></i>`);
  }
  return result;
}

/**
 * Get Lucide icon HTML for a specific emoji
 * @param {string} emoji - The emoji to convert
 * @param {string} className - Additional CSS classes
 * @returns {string} Lucide icon HTML
 */
export function getIconForEmoji(emoji, className = '') {
  const iconName = iconMap[emoji];
  if (!iconName) return emoji;
  return `<i data-lucide="${iconName}" class="lucide-icon ${className}"></i>`;
}

/**
 * Check if a string contains emojis that can be replaced
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export function hasReplaceableEmojis(text) {
  if (!text) return false;
  return Object.keys(iconMap).some(emoji => text.includes(emoji));
}
