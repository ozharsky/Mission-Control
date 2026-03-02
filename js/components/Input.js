/**
 * Input Component
 * Reusable input field with label, hint, and error support
 * 
 * Usage:
 *   Input({
 *     label: 'Email',
 *     type: 'email',
 *     placeholder: 'Enter your email',
 *     value: '',
 *     onChange: (value) => {}
 *   })
 */

/**
 * Create an input element
 * @param {Object} props - Input properties
 * @param {string} [props.label] - Input label
 * @param {string} [props.type='text'] - Input type (text, email, password, number, etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Initial value
 * @param {string} [props.name] - Input name attribute
 * @param {string} [props.id] - Input id attribute
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {boolean} [props.required=false] - Whether input is required
 * @param {string} [props.hint] - Help text below input
 * @param {string} [props.error] - Error message
 * @param {Function} [props.onChange] - Change handler
 * @param {Function} [props.onFocus] - Focus handler
 * @param {Function} [props.onBlur] - Blur handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Form group element containing the input
 */
export const Input = ({
  label,
  type = 'text',
  placeholder = '',
  value = '',
  name,
  id,
  disabled = false,
  required = false,
  hint,
  error,
  onChange,
  onFocus,
  onBlur,
  className = ''
}) => {
  const formGroup = document.createElement('div');
  formGroup.className = `form-group ${className}`;
  
  // Label
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.textContent = label;
    if (id) labelEl.htmlFor = id;
    if (required) {
      const requiredMark = document.createElement('span');
      requiredMark.className = 'text-danger';
      requiredMark.textContent = ' *';
      labelEl.appendChild(requiredMark);
    }
    formGroup.appendChild(labelEl);
  }
  
  // Input
  const input = document.createElement('input');
  input.type = type;
  input.className = `form-input ${error ? 'form-input--error' : ''}`;
  input.placeholder = placeholder;
  input.value = value;
  input.disabled = disabled;
  input.required = required;
  
  if (name) input.name = name;
  if (id) input.id = id;
  
  // Event handlers
  if (onChange) {
    input.addEventListener('input', (e) => onChange(e.target.value, e));
  }
  if (onFocus) {
    input.addEventListener('focus', onFocus);
  }
  if (onBlur) {
    input.addEventListener('blur', onBlur);
  }
  
  formGroup.appendChild(input);
  
  // Hint text
  if (hint && !error) {
    const hintEl = document.createElement('p');
    hintEl.className = 'form-hint';
    hintEl.textContent = hint;
    formGroup.appendChild(hintEl);
  }
  
  // Error message
  if (error) {
    const errorEl = document.createElement('p');
    errorEl.className = 'form-error';
    errorEl.textContent = error;
    formGroup.appendChild(errorEl);
  }
  
  return formGroup;
};

/**
 * Create a textarea element
 * @param {Object} props - Textarea properties
 * @param {string} [props.label] - Textarea label
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Initial value
 * @param {number} [props.rows=4] - Number of rows
 * @param {boolean} [props.disabled=false] - Whether textarea is disabled
 * @param {boolean} [props.required=false] - Whether textarea is required
 * @param {string} [props.hint] - Help text
 * @param {string} [props.error] - Error message
 * @param {Function} [props.onChange] - Change handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Form group element
 */
export const Textarea = ({
  label,
  placeholder = '',
  value = '',
  rows = 4,
  disabled = false,
  required = false,
  hint,
  error,
  onChange,
  className = ''
}) => {
  const formGroup = document.createElement('div');
  formGroup.className = `form-group ${className}`;
  
  // Label
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.textContent = label;
    if (required) {
      const requiredMark = document.createElement('span');
      requiredMark.className = 'text-danger';
      requiredMark.textContent = ' *';
      labelEl.appendChild(requiredMark);
    }
    formGroup.appendChild(labelEl);
  }
  
  // Textarea
  const textarea = document.createElement('textarea');
  textarea.className = `form-textarea ${error ? 'form-input--error' : ''}`;
  textarea.placeholder = placeholder;
  textarea.value = value;
  textarea.rows = rows;
  textarea.disabled = disabled;
  textarea.required = required;
  
  if (onChange) {
    textarea.addEventListener('input', (e) => onChange(e.target.value, e));
  }
  
  formGroup.appendChild(textarea);
  
  // Hint text
  if (hint && !error) {
    const hintEl = document.createElement('p');
    hintEl.className = 'form-hint';
    hintEl.textContent = hint;
    formGroup.appendChild(hintEl);
  }
  
  // Error message
  if (error) {
    const errorEl = document.createElement('p');
    errorEl.className = 'form-error';
    errorEl.textContent = error;
    formGroup.appendChild(errorEl);
  }
  
  return formGroup;
};

/**
 * Create a select dropdown
 * @param {Object} props - Select properties
 * @param {string} [props.label] - Select label
 * @param {Array<{value: string, label: string}>} props.options - Select options
 * @param {string} [props.value] - Selected value
 * @param {boolean} [props.disabled=false] - Whether select is disabled
 * @param {boolean} [props.required=false] - Whether select is required
 * @param {string} [props.placeholder] - Placeholder option
 * @param {Function} [props.onChange] - Change handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Form group element
 */
export const Select = ({
  label,
  options = [],
  value = '',
  disabled = false,
  required = false,
  placeholder,
  onChange,
  className = ''
}) => {
  const formGroup = document.createElement('div');
  formGroup.className = `form-group ${className}`;
  
  // Label
  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.textContent = label;
    if (required) {
      const requiredMark = document.createElement('span');
      requiredMark.className = 'text-danger';
      requiredMark.textContent = ' *';
      labelEl.appendChild(requiredMark);
    }
    formGroup.appendChild(labelEl);
  }
  
  // Select
  const select = document.createElement('select');
  select.className = 'form-select';
  select.disabled = disabled;
  select.required = required;
  
  // Placeholder option
  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = !value;
    select.appendChild(placeholderOption);
  }
  
  // Options
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (value === opt.value) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  
  if (onChange) {
    select.addEventListener('change', (e) => onChange(e.target.value, e));
  }
  
  formGroup.appendChild(select);
  
  return formGroup;
};

export default Input;
