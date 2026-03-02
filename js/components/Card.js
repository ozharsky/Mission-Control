/**
 * Card Component
 * Reusable card with header, body, and footer sections
 * 
 * Usage:
 *   Card({
 *     header: { title: 'Card Title', actions: [Button(...)] },
 *     body: HTMLElement or string,
 *     footer: { content: HTMLElement, align: 'right' },
 *     clickable: true,
 *     onClick: () => {}
 *   })
 */

export const Card = ({
  header = null,
  body = null,
  footer = null,
  clickable = false,
  elevated = false,
  className = '',
  onClick,
  ...props
}) => {
  const card = document.createElement('div');
  
  // Base classes
  const classes = ['card', className];
  if (clickable) classes.push('card--clickable');
  if (elevated) classes.push('card--elevated');
  
  card.className = classes.join(' ');
  
  // Click handler
  if (clickable && onClick) {
    card.addEventListener('click', onClick);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    
    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    });
  }
  
  // Header
  if (header) {
    const headerEl = document.createElement('div');
    headerEl.className = 'card__header';
    
    if (typeof header === 'string') {
      const title = document.createElement('h3');
      title.className = 'card__title';
      title.textContent = header;
      headerEl.appendChild(title);
    } else if (header.title || header.actions) {
      if (header.title) {
        const title = document.createElement('h3');
        title.className = 'card__title';
        title.textContent = header.title;
        headerEl.appendChild(title);
      }
      
      if (header.actions) {
        const actions = document.createElement('div');
        actions.className = 'flex gap-2';
        if (Array.isArray(header.actions)) {
          actions.append(...header.actions);
        } else {
          actions.appendChild(header.actions);
        }
        headerEl.appendChild(actions);
      }
    } else {
      headerEl.appendChild(header);
    }
    
    card.appendChild(headerEl);
  }
  
  // Body
  if (body) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'card__body';
    
    if (typeof body === 'string') {
      bodyEl.innerHTML = body;
    } else if (body instanceof HTMLElement) {
      bodyEl.appendChild(body);
    } else if (Array.isArray(body)) {
      bodyEl.append(...body);
    }
    
    card.appendChild(bodyEl);
  }
  
  // Footer
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'card__footer';
    
    if (footer.align) {
      footerEl.style.justifyContent = footer.align === 'center' ? 'center' : 
                                      footer.align === 'left' ? 'flex-start' : 'flex-end';
    }
    
    if (typeof footer === 'string') {
      footerEl.textContent = footer;
    } else if (footer.content) {
      if (typeof footer.content === 'string') {
        footerEl.innerHTML = footer.content;
      } else if (footer.content instanceof HTMLElement) {
        footerEl.appendChild(footer.content);
      } else if (Array.isArray(footer.content)) {
        footerEl.append(...footer.content);
      }
    } else if (footer instanceof HTMLElement) {
      footerEl.appendChild(footer);
    }
    
    card.appendChild(footerEl);
  }
  
  // Apply additional data attributes
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('data-')) {
      card.setAttribute(key, value);
    }
  });
  
  return card;
};

/**
 * Stat Card - Specialized card for displaying metrics
 */
export const StatCard = ({
  title,
  value,
  change = null,
  changeType = 'neutral', // positive | negative | neutral
  icon = null,
  onClick
}) => {
  const body = document.createElement('div');
  
  if (icon) {
    const iconEl = document.createElement('div');
    iconEl.className = 'mb-4';
    iconEl.innerHTML = `<i data-lucide="${icon}" style="width: 24px; height: 24px; color: var(--color-primary);"></i>`;
    body.appendChild(iconEl);
  }
  
  const valueEl = document.createElement('div');
  valueEl.className = 'text-2xl font-bold mb-1';
  valueEl.textContent = value;
  body.appendChild(valueEl);
  
  const titleEl = document.createElement('div');
  titleEl.className = 'text-sm text-secondary';
  titleEl.textContent = title;
  body.appendChild(titleEl);
  
  if (change !== null) {
    const changeEl = document.createElement('div');
    changeEl.className = `text-xs mt-2 ${changeType === 'positive' ? 'text-success' : changeType === 'negative' ? 'text-danger' : 'text-muted'}`;
    const arrow = changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '•';
    changeEl.textContent = `${arrow} ${change}`;
    body.appendChild(changeEl);
  }
  
  return Card({
    body,
    clickable: !!onClick,
    onClick,
    className: 'stat-card'
  });
};

export default Card;
