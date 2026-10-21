// utils/validate.js
// Helpers for reading untrusted form input.

// Returns the value as a trimmed string, or '' for anything that is not a string
// (arrays from repeated fields, objects from JSON bodies, undefined).
function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Copies only the listed fields from `body`, as trimmed strings.
function pickFields(body, fields) {
  const out = {};
  fields.forEach(f => { out[f] = str(body[f]); });
  return out;
}

function missingFields(data, required) {
  return required.filter(f => !data[f]);
}

const PHONE_REGEX = /^\+\d{1,3}[\s-]?\d[\d\s-]{3,16}\d$/; // e.g. +266 5812 3456

function isValidPhone(phone) {
  return PHONE_REGEX.test(phone) && phone.replace(/\D/g, '').length <= 15;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Only allow same-site relative paths as redirect targets
function safeRedirect(target, fallback = '/') {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/\\')
    ? target
    : fallback;
}

module.exports = { str, pickFields, missingFields, isValidPhone, isValidEmail, safeRedirect };
