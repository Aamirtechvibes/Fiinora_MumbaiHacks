export function isEmail(v: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

export function isStrongPassword(v: string) {
  // at least 8 chars, 1 letter and 1 number
  return /(?=.{8,})(?=.*[A-Za-z])(?=.*\d)/.test(v);
}

export function isName(v: string) {
  return v.trim().length > 0;
}

export default { isEmail, isStrongPassword, isName };
