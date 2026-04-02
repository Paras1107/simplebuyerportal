function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function validateRegister(body) {
  const errors = [];
  if (!isNonEmptyString(body.name)) {
    errors.push('Name is required');
  }
  if (!isNonEmptyString(body.email)) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(body.email))) {
    errors.push('Email must be valid');
  }
  if (!isNonEmptyString(body.password)) {
    errors.push('Password is required');
  } else if (body.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!isNonEmptyString(body.email)) {
    errors.push('Email is required');
  }
  if (!isNonEmptyString(body.password)) {
    errors.push('Password is required');
  }
  return errors;
}

function parsePropertyId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    return { error: 'propertyId must be a positive integer' };
  }
  return { id };
}

module.exports = {
  normalizeEmail,
  validateRegister,
  validateLogin,
  parsePropertyId,
};
