import React from 'react';
import { DEPARTMENT_OPTIONS, DEFAULT_DEPARTMENT_PLACEHOLDER } from '../constants/departments';
import './DepartmentSelect.css';

/**
 * Reusable department dropdown with consistent styling and accessibility.
 * Used in Department registration and Pradhikaran create-question forms.
 *
 * @param {string} value - Selected department value
 * @param {function} onChange - (value: string) => void
 * @param {boolean} [required=false] - Whether selection is required
 * @param {string} [error] - Validation error message to display
 * @param {string} [id='department-select'] - Id for the select (for label association)
 * @param {string} [label='Department'] - Label text
 * @param {string} [placeholder] - Placeholder option text
 * @param {string} [className] - Additional CSS class for the wrapper
 */
export default function DepartmentSelect({
  value,
  onChange,
  required = false,
  error = '',
  id = 'department-select',
  label = 'Department',
  placeholder = DEFAULT_DEPARTMENT_PLACEHOLDER,
  className = '',
  options = DEPARTMENT_OPTIONS,
}) {
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="department-select-label">
        {label}
        {required && <span className="required-asterisk" aria-hidden="true"> *</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`department-select-input ${error ? 'department-select-input--error' : ''}`}
        autoComplete="organization"
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
      {error && (
        <div
          id={`${id}-error`}
          className="department-select-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
