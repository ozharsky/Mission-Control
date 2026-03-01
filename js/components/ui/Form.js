/**
 * Form Components for Mission Control V5
 * Matches React app design system
 * 
 * Usage:
 * import { 
 *   createInput, createSelect, createTextarea, createFormGroup,
 *   createCheckbox, createRadioGroup, createToggle
 * } from './components/ui/Form.js';
 * 
 * // Text input
 * createInput({ label: 'Name', placeholder: 'Enter name', required: true })
 * 
 * // Select dropdown
 * createSelect({ 
 *   label: 'Priority', 
 *   options: [
 *     { value: 'low', label: 'Low' },
 *     { value: 'high', label: 'High' }
 *   ]
 * })
 * 
 * // Textarea
 * createTextarea({ label: 'Description', rows: 4 })
 * 
 * // Form group wrapper
 * createFormGroup({ label: 'Email', children: createInput({ type: 'email' }) })
 */

/**
 * Create a form input element
 * @param {Object} options - Input configuration
 * @param {string} options.type - Input type: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'search' | 'tel' | 'url'
 * @param {string} options.name - Input name attribute
 * @param {string} options.id - Input ID
 * @param {string} options.value - Input value
 * @param {string} options.placeholder - Placeholder text
 * @param {string} options.label - Label text (creates wrapped form group)
 * @param {boolean} options.required - Required field
 * @param {boolean} options.disabled - Disabled state
 * @param {boolean} options.readOnly - Read-only state
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {Function} options.onChange - Change handler
 * @param {Function} options.onFocus - Focus handler
 * @param {Function} options.onBlur - Blur handler
 * @param {number} options.min - Min value (for number inputs)
 * @param {number} options.max - Max value (for number inputs)
 * @param {number} options.step - Step value (for number inputs)
 * @param {string} options.autocomplete - Autocomplete attribute
 * @param {string} options.pattern - Pattern attribute for validation
 * @returns {string} HTML string for the input
 */
export function createInput({
  type = 'text',
  name,
  id,
  value,
  placeholder,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  className = '',
  error,
  hint,
  onChange,
  onFocus,
  onBlur,
  min,
  max,
  step,
  autocomplete,
  pattern
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const errorClass = hasError ? 'm-input-error' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const readOnlyAttr = readOnly ? 'readonly' : '';
  const requiredAttr = required ? 'required' : '';
  
  // Build input attributes
  const attrs = [
    `type="${type}"`,
    `id="${inputId}"`,
    `class="m-input ${errorClass} ${className}"`,
    disabledAttr,
    readOnlyAttr,
    requiredAttr
  ];
  
  if (name) attrs.push(`name="${name}"`);
  if (value !== undefined) attrs.push(`value="${escapeHtml(value)}"`);
  if (placeholder) attrs.push(`placeholder="${escapeHtml(placeholder)}"`);
  if (min !== undefined) attrs.push(`min="${min}"`);
  if (max !== undefined) attrs.push(`max="${max}"`);
  if (step !== undefined) attrs.push(`step="${step}"`);
  if (autocomplete) attrs.push(`autocomplete="${autocomplete}"`);
  if (pattern) attrs.push(`pattern="${pattern}"`);
  
  // Event handlers
  if (onChange) attrs.push(`onchange="${onChange}"`);
  if (onFocus) attrs.push(`onfocus="${onFocus}"`);
  if (onBlur) attrs.push(`onblur="${onBlur}"`);
  
  const inputHtml = `<input ${attrs.join(' ')} />`;
  
  // If label provided, wrap in form group
  if (label) {
    return createFormGroup({
      label,
      labelFor: inputId,
      required,
      error,
      hint,
      children: inputHtml
    });
  }
  
  return inputHtml;
}

/**
 * Create a select dropdown element
 * @param {Object} options - Select configuration
 * @param {string} options.name - Select name attribute
 * @param {string} options.id - Select ID
 * @param {string} options.value - Selected value
 * @param {Array} options.options - Array of { value, label, disabled?, group? }
 * @param {string} options.label - Label text
 * @param {string} options.placeholder - Placeholder option (value: '')
 * @param {boolean} options.required - Required field
 * @param {boolean} options.disabled - Disabled state
 * @param {boolean} options.multiple - Allow multiple selection
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {Function} options.onChange - Change handler
 * @returns {string} HTML string for the select
 */
export function createSelect({
  name,
  id,
  value,
  options = [],
  label,
  placeholder,
  required = false,
  disabled = false,
  multiple = false,
  className = '',
  error,
  hint,
  onChange
}) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const errorClass = hasError ? 'm-select-error' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const requiredAttr = required ? 'required' : '';
  const multipleAttr = multiple ? 'multiple' : '';
  
  const attrs = [
    `id="${selectId}"`,
    `class="m-select ${errorClass} ${className}"`,
    disabledAttr,
    requiredAttr,
    multipleAttr
  ];
  
  if (name) attrs.push(`name="${name}"`);
  if (onChange) attrs.push(`onchange="${onChange}"`);
  
  // Build options HTML
  let optionsHtml = '';
  
  if (placeholder && !multiple) {
    optionsHtml += `<option value="" ${!value ? 'selected' : ''} disabled>${escapeHtml(placeholder)}</option>`;
  }
  
  // Group options by group property
  const groups = {};
  const ungrouped = [];
  
  options.forEach(opt => {
    if (opt.group) {
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group].push(opt);
    } else {
      ungrouped.push(opt);
    }
  });
  
  // Add ungrouped options
  ungrouped.forEach(opt => {
    const selected = value === opt.value ? 'selected' : '';
    const disabled = opt.disabled ? 'disabled' : '';
    optionsHtml += `<option value="${escapeHtml(opt.value)}" ${selected} ${disabled}>${escapeHtml(opt.label)}</option>`;
  });
  
  // Add grouped options
  Object.entries(groups).forEach(([groupName, groupOptions]) => {
    optionsHtml += `<optgroup label="${escapeHtml(groupName)}">`;
    groupOptions.forEach(opt => {
      const selected = value === opt.value ? 'selected' : '';
      const disabled = opt.disabled ? 'disabled' : '';
      optionsHtml += `<option value="${escapeHtml(opt.value)}" ${selected} ${disabled}>${escapeHtml(opt.label)}</option>`;
    });
    optionsHtml += '</optgroup>';
  });
  
  const selectHtml = `<select ${attrs.join(' ')}>${optionsHtml}</select>`;
  
  if (label) {
    return createFormGroup({
      label,
      labelFor: selectId,
      required,
      error,
      hint,
      children: selectHtml
    });
  }
  
  return selectHtml;
}

/**
 * Create a textarea element
 * @param {Object} options - Textarea configuration
 * @param {string} options.name - Textarea name attribute
 * @param {string} options.id - Textarea ID
 * @param {string} options.value - Textarea value
 * @param {string} options.placeholder - Placeholder text
 * @param {number} options.rows - Number of rows (default: 3)
 * @param {number} options.cols - Number of columns
 * @param {string} options.label - Label text
 * @param {boolean} options.required - Required field
 * @param {boolean} options.disabled - Disabled state
 * @param {boolean} options.readOnly - Read-only state
 * @param {boolean} options.resizable - Allow resize (default: true)
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {number} options.maxLength - Maximum character length
 * @param {Function} options.onChange - Change handler
 * @param {Function} options.onInput - Input handler
 * @returns {string} HTML string for the textarea
 */
export function createTextarea({
  name,
  id,
  value,
  placeholder,
  rows = 3,
  cols,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  resizable = true,
  className = '',
  error,
  hint,
  maxLength,
  onChange,
  onInput
}) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const errorClass = hasError ? 'm-textarea-error' : '';
  const resizeClass = resizable ? '' : 'm-textarea-no-resize';
  const disabledAttr = disabled ? 'disabled' : '';
  const readOnlyAttr = readOnly ? 'readonly' : '';
  const requiredAttr = required ? 'required' : '';
  
  const attrs = [
    `id="${textareaId}"`,
    `rows="${rows}"`,
    `class="m-textarea ${errorClass} ${resizeClass} ${className}"`,
    disabledAttr,
    readOnlyAttr,
    requiredAttr
  ];
  
  if (name) attrs.push(`name="${name}"`);
  if (cols) attrs.push(`cols="${cols}"`);
  if (placeholder) attrs.push(`placeholder="${escapeHtml(placeholder)}"`);
  if (maxLength) attrs.push(`maxlength="${maxLength}"`);
  if (onChange) attrs.push(`onchange="${onChange}"`);
  if (onInput) attrs.push(`oninput="${onInput}"`);
  
  const textareaHtml = `<textarea ${attrs.join(' ')}>${value ? escapeHtml(value) : ''}</textarea>`;
  
  if (label) {
    return createFormGroup({
      label,
      labelFor: textareaId,
      required,
      error,
      hint,
      children: textareaHtml
    });
  }
  
  return textareaHtml;
}

/**
 * Create a checkbox element
 * @param {Object} options - Checkbox configuration
 * @param {string} options.name - Checkbox name attribute
 * @param {string} options.id - Checkbox ID
 * @param {string} options.value - Checkbox value
 * @param {boolean} options.checked - Checked state
 * @param {string} options.label - Label text (displayed next to checkbox)
 * @param {boolean} options.disabled - Disabled state
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {Function} options.onChange - Change handler
 * @returns {string} HTML string for the checkbox
 */
export function createCheckbox({
  name,
  id,
  value,
  checked = false,
  label,
  disabled = false,
  className = '',
  error,
  hint,
  onChange
}) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const errorClass = hasError ? 'm-checkbox-error' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const checkedAttr = checked ? 'checked' : '';
  
  const attrs = [
    `type="checkbox"`,
    `id="${checkboxId}"`,
    `class="m-checkbox-input ${errorClass} ${className}"`,
    disabledAttr,
    checkedAttr
  ];
  
  if (name) attrs.push(`name="${name}"`);
  if (value !== undefined) attrs.push(`value="${escapeHtml(value)}"`);
  if (onChange) attrs.push(`onchange="${onChange}"`);
  
  const checkboxHtml = `
    <div class="m-checkbox-wrapper">
      <input ${attrs.join(' ')} />
      <label for="${checkboxId}" class="m-checkbox-label">
        <span class="m-checkbox-box">
          <svg class="m-checkbox-check" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        ${label ? `<span class="m-checkbox-text">${escapeHtml(label)}</span>` : ''}
      </label>
      ${hint ? `<div class="m-checkbox-hint">${escapeHtml(hint)}</div>` : ''}
      ${error ? `<div class="m-checkbox-error-text">${escapeHtml(error)}</div>` : ''}
    </div>
  `;
  
  return checkboxHtml;
}

/**
 * Create a radio button group
 * @param {Object} options - Radio group configuration
 * @param {string} options.name - Radio group name (shared across options)
 * @param {string} options.value - Selected value
 * @param {Array} options.options - Array of { value, label, disabled? }
 * @param {string} options.label - Group label
 * @param {boolean} options.disabled - Disabled state for entire group
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {Function} options.onChange - Change handler
 * @param {string} options.layout - Layout: 'vertical' | 'horizontal'
 * @returns {string} HTML string for the radio group
 */
export function createRadioGroup({
  name,
  value,
  options = [],
  label,
  disabled = false,
  className = '',
  error,
  hint,
  onChange,
  layout = 'vertical'
}) {
  const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const errorClass = hasError ? 'm-radio-group-error' : '';
  const layoutClass = layout === 'horizontal' ? 'm-radio-group-horizontal' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  
  const radiosHtml = options.map((opt, index) => {
    const radioId = `${groupId}-${index}`;
    const checked = value === opt.value ? 'checked' : '';
    const optDisabled = opt.disabled || disabled ? 'disabled' : '';
    
    const attrs = [
      `type="radio"`,
      `id="${radioId}"`,
      `name="${name}"`,
      `value="${escapeHtml(opt.value)}"`,
      `class="m-radio-input"`,
      checked,
      optDisabled
    ];
    
    if (onChange) attrs.push(`onchange="${onChange}"`);
    
    return `
      <div class="m-radio-wrapper">
        <input ${attrs.join(' ')} />
        <label for="${radioId}" class="m-radio-label">
          <span class="m-radio-circle"></span>
          <span class="m-radio-text">${escapeHtml(opt.label)}</span>
        </label>
      </div>
    `;
  }).join('');
  
  const groupHtml = `
    <div class="m-radio-group ${layoutClass} ${errorClass} ${className}" role="radiogroup" aria-label="${escapeHtml(label || '')}">
      ${radiosHtml}
    </div>
  `;
  
  if (label) {
    return createFormGroup({
      label,
      error,
      hint,
      children: groupHtml
    });
  }
  
  return groupHtml;
}

/**
 * Create a toggle switch
 * @param {Object} options - Toggle configuration
 * @param {string} options.name - Toggle name attribute
 * @param {string} options.id - Toggle ID
 * @param {boolean} options.checked - Checked state
 * @param {string} options.label - Label text
 * @param {string} options.onLabel - Label when ON (default: 'On')
 * @param {string} options.offLabel - Label when OFF (default: 'Off')
 * @param {boolean} options.disabled - Disabled state
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {Function} options.onChange - Change handler
 * @returns {string} HTML string for the toggle
 */
export function createToggle({
  name,
  id,
  checked = false,
  label,
  onLabel = 'On',
  offLabel = 'Off',
  disabled = false,
  className = '',
  error,
  hint,
  onChange
}) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const errorClass = hasError ? 'm-toggle-error' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const checkedAttr = checked ? 'checked' : '';
  
  const attrs = [
    `type="checkbox"`,
    `id="${toggleId}"`,
    `class="m-toggle-input ${errorClass} ${className}"`,
    disabledAttr,
    checkedAttr
  ];
  
  if (name) attrs.push(`name="${name}"`);
  if (onChange) attrs.push(`onchange="${onChange}"`);
  
  const toggleHtml = `
    <div class="m-toggle-wrapper">
      ${label ? `<span class="m-toggle-label-text">${escapeHtml(label)}</span>` : ''}
      <label class="m-toggle ${className}">
        <input ${attrs.join(' ')} />
        <span class="m-toggle-slider">
          <span class="m-toggle-thumb"></span>
        </span>
        <span class="m-toggle-status">${checked ? escapeHtml(onLabel) : escapeHtml(offLabel)}</span>
      </label>
      ${hint ? `<div class="m-toggle-hint">${escapeHtml(hint)}</div>` : ''}
      ${error ? `<div class="m-toggle-error-text">${escapeHtml(error)}</div>` : ''}
    </div>
  `;
  
  return toggleHtml;
}

/**
 * Create a form group wrapper (label + input + hints/errors)
 * @param {Object} options - Form group configuration
 * @param {string} options.label - Label text
 * @param {string} options.labelFor - ID of the input this label is for
 * @param {boolean} options.required - Show required indicator
 * @param {string} options.children - HTML content (the input element)
 * @param {string} options.error - Error message
 * @param {string} options.hint - Help text
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the form group
 */
export function createFormGroup({
  label,
  labelFor,
  required = false,
  children,
  error,
  hint,
  className = ''
}) {
  const requiredIndicator = required ? '<span class="m-form-required" aria-hidden="true">*</span>' : '';
  const hasError = !!error;
  const errorClass = hasError ? 'm-form-group-error' : '';
  
  return `
    <div class="m-form-group ${errorClass} ${className}">
      ${label ? `
        <label for="${labelFor}" class="m-form-label">
          ${escapeHtml(label)}${requiredIndicator}
        </label>
      ` : ''}
      <div class="m-form-control">
        ${children}
      </div>
      ${hint ? `<div class="m-form-hint">${escapeHtml(hint)}</div>` : ''}
      ${error ? `<div class="m-form-error" role="alert">${escapeHtml(error)}</div>` : ''}
    </div>
  `;
}

/**
 * Create a fieldset/legend group for related form elements
 * @param {Object} options - Fieldset configuration
 * @param {string} options.legend - Legend text
 * @param {string} options.children - HTML content
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the fieldset
 */
export function createFieldset({
  legend,
  children,
  className = ''
}) {
  return `
    <fieldset class="m-fieldset ${className}">
      ${legend ? `<legend class="m-fieldset-legend">${escapeHtml(legend)}</legend>` : ''}
      <div class="m-fieldset-content">
        ${children}
      </div>
    </fieldset>
  `;
}

/**
 * Create a form row (for side-by-side inputs)
 * @param {Object} options - Form row configuration
 * @param {Array} options.children - Array of form element HTML strings
 * @param {string} options.className - Additional CSS classes
 * @param {number} options.gap - Gap between items (in rem)
 * @returns {string} HTML string for the form row
 */
export function createFormRow({
  children = [],
  className = '',
  gap
}) {
  const style = gap !== undefined ? `style="--m-form-row-gap: ${gap}rem"` : '';
  
  return `
    <div class="m-form-row ${className}" ${style}>
      ${children.join('')}
    </div>
  `;
}

/**
 * Initialize form elements in a container
 * @param {HTMLElement} container - Container element
 */
export function initForms(container = document) {
  // Add touch feedback to form controls
  container.querySelectorAll('.m-input, .m-select, .m-textarea').forEach(el => {
    el.addEventListener('focus', () => {
      el.closest('.m-form-group')?.classList.add('m-form-group-focused');
    });
    
    el.addEventListener('blur', () => {
      el.closest('.m-form-group')?.classList.remove('m-form-group-focused');
    });
  });
  
  // Toggle switch status text update
  container.querySelectorAll('.m-toggle-input').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const status = e.target.closest('.m-toggle-wrapper')?.querySelector('.m-toggle-status');
      if (status) {
        status.textContent = e.target.checked ? 'On' : 'Off';
      }
    });
  });
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
