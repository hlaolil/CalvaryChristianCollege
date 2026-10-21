const test = require('node:test');
const assert = require('node:assert');
const { str, pickFields, missingFields, isValidPhone, isValidEmail, safeRedirect } = require('../utils/validate');
const { upcomingSemesters, isAvailableProgram, programsByLevel, PROGRAMS } = require('../utils/programs');
const { tokensMatch } = require('../middleware/csrf');
const { homeFor } = require('../middleware/auth');

test('str() trims strings and rejects everything else', () => {
  assert.strictEqual(str('  a  '), 'a');
  assert.strictEqual(str(['a', 'b']), '');
  assert.strictEqual(str({ $ne: null }), '');
  assert.strictEqual(str(undefined), '');
});

test('pickFields() keeps only listed fields', () => {
  const picked = pickFields({ phone: ' 1 ', userId: 'evil', status: 'Approved' }, ['phone', 'town']);
  assert.deepStrictEqual(picked, { phone: '1', town: '' });
  assert.deepStrictEqual(missingFields(picked, ['phone', 'town']), ['town']);
});

test('isValidPhone() accepts the formats shown in placeholders', () => {
  assert.ok(isValidPhone('+266 5812 3456'));
  assert.ok(isValidPhone('+266 58123456'));
  assert.ok(isValidPhone('+26658123456'));
  assert.ok(!isValidPhone('58123456'));
  assert.ok(!isValidPhone('+266 abc'));
});

test('isValidEmail()', () => {
  assert.ok(isValidEmail('a@b.co'));
  assert.ok(!isValidEmail('not-an-email'));
});

test('safeRedirect() only allows same-site paths', () => {
  assert.strictEqual(safeRedirect('/apply'), '/apply');
  assert.strictEqual(safeRedirect('//evil.com'), '/');
  assert.strictEqual(safeRedirect('/\\evil.com'), '/');
  assert.strictEqual(safeRedirect('https://evil.com', '/x'), '/x');
  assert.strictEqual(safeRedirect(undefined, '/x'), '/x');
});

test('upcomingSemesters() lists the next January/July intakes', () => {
  assert.deepStrictEqual(upcomingSemesters(new Date('2026-10-21')), ['January 2027', 'July 2027', 'January 2028']);
  assert.deepStrictEqual(upcomingSemesters(new Date('2026-03-01')), ['July 2026', 'January 2027', 'July 2027']);
});

test('programs: only available programs validate', () => {
  assert.ok(isAvailableProgram('Level 5 Bachelor of Ministry'));
  assert.ok(!isAvailableProgram('Level 3 Diploma in Theology'));
  assert.ok(!isAvailableProgram('Made up'));
  const flattened = programsByLevel().flatMap(g => g.programs);
  assert.strictEqual(flattened.length, PROGRAMS.length);
});

test('tokensMatch()', () => {
  assert.ok(tokensMatch('abc', 'abc'));
  assert.ok(!tokensMatch('abc', 'abd'));
  assert.ok(!tokensMatch('abc', 'abcd'));
  assert.ok(!tokensMatch(undefined, 'abc'));
});

test('homeFor() sends each role to its page', () => {
  assert.strictEqual(homeFor({ role: 'student' }), '/student-portal');
  assert.strictEqual(homeFor({ role: 'alumni' }), '/alumni');
  assert.strictEqual(homeFor(null), '/');
});
