// Renders every view with the locals its controller passes, for each kind of
// visitor, so a template referencing a missing variable fails here instead of
// showing visitors an error page.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const ejs = require('ejs');
const { programsByLevel, upcomingSemesters } = require('../utils/programs');
const { emptyPage } = require('../utils/pagination');
const { homeFor } = require('../middleware/auth');

const VIEWS = path.join(__dirname, '..', 'views');

const USERS = {
  guest: null,
  applicant: { id: '1', name: 'Ann', email: 'ann@example.com', role: 'applicant', phoneNumber: '+266 5812 3456' },
  student: { id: '2', name: 'Sam', email: 'sam@example.com', role: 'student', studentNumber: 'AB1234', programOfStudy: 'Level 5 Bachelor of Ministry', createdAt: new Date() },
  alumni: { id: '3', name: 'Al', email: 'al@example.com', role: 'alumni' },
  admin: { id: '4', name: 'Ada', email: 'ada@example.com', role: 'admin' }
};

function locals(user, extra) {
  return {
    user,
    homeHref: homeFor(user),
    path: '/',
    currentYear: new Date().getFullYear(),
    csrfToken: 'token',
    ...extra
  };
}

function render(view, data) {
  return ejs.renderFile(path.join(VIEWS, `${view}.ejs`), data);
}

const application = {
  _id: 'a1', userId: '1', name: 'Ann', email: 'ann@example.com', phone: '+266 5812 3456',
  program: 'Level 5 Bachelor of Ministry', semester: 'January 2027', status: 'Pending',
  submittedAt: new Date(), dob: '2000-01-01'
};

const pageWith = (param, total) => ({ ...emptyPage(param), pages: 2, total, query: {} });

const cases = {
  index: () => ({ title: 'Home' }),
  about: () => ({ title: 'About Us' }),
  academics: () => ({ title: 'Academics' }),
  404: () => ({ title: 'Page Not Found' }),
  error: () => ({ title: 'Oops', message: 'Something went wrong' }),
  login: () => ({ title: 'Login', error: 'Invalid email or password', resetSuccess: false, form: { email: 'x@y.z' } }),
  register: () => ({ title: 'Register', error: 'x', roles: ['applicant', 'student'], programGroups: programsByLevel(), form: { role: 'student' } }),
  'forgot-password': () => ({ title: 'Forgot Password', error: null, success: 'sent' }),
  'reset-password': () => ({ title: 'Reset Password', error: 'x', token: 'abc', minLength: 8 }),
  contact: () => ({
    title: 'Contact Us', error: 'x', success: false, form: { message: 'hi' },
    users: [{ name: 'Ann', email: 'a@b.c', role: 'admin', createdAt: new Date() }],
    contacts: [{ name: 'B', email: 'b@c.d', message: 'hello', date: new Date() }],
    usersPage: pageWith('upage', 30), contactsPage: emptyPage('cpage')
  })
};

const loggedInCases = {
  apply: () => ({
    title: 'Application Form', error: 'x', success: true, form: { town: 'Maseru' },
    applications: [application], page: pageWith('page', 30), existingApplication: null,
    programGroups: programsByLevel(), semesters: upcomingSemesters(),
    yesNoFields: ['salvation', 'baptism']
  }),
  alumni: () => ({
    title: 'Alumni Registration', error: null, success: false, form: {},
    alumni: [{ name: 'Al', email: 'al@example.com', submittedAt: new Date(), dob: '1990-01-01' }],
    page: emptyPage('page'), existingAlumni: null
  }),
  'student-portal': () => ({
    title: 'Student Portal', error: null, studentApp: application, page: emptyPage('page'),
    allStudents: [{ _id: '2', name: 'Sam', email: 's@x.y', application }]
  })
};

for (const [role, user] of Object.entries(USERS)) {
  for (const [view, data] of Object.entries(cases)) {
    test(`${view} renders for ${role}`, async () => {
      const html = await render(view, locals(user, data()));
      assert.match(html, /<\/html>/);
      assert.strictEqual((html.match(/<head>/g) || []).length, 1, 'exactly one <head>');
    });
  }
  if (!user) continue;
  for (const [view, data] of Object.entries(loggedInCases)) {
    test(`${view} renders for ${role}`, async () => {
      const html = await render(view, locals(user, data()));
      assert.match(html, /<\/html>/);
      assert.strictEqual((html.match(/<head>/g) || []).length, 1, 'exactly one <head>');
    });
  }
}

test('every POST form carries a CSRF token', async () => {
  for (const [role, user] of Object.entries(USERS)) {
    const all = { ...cases, ...(user ? loggedInCases : {}) };
    for (const [view, data] of Object.entries(all)) {
      const html = await render(view, locals(user, data()));
      const forms = html.match(/<form[^>]*method="POST"[^>]*>[\s\S]*?<\/form>/g) || [];
      forms.forEach(form => assert.match(form, /name="_csrf"/, `${view} (${role}) form without _csrf`));
    }
  }
});

test('no inline scripts or event handlers (blocked by the Content Security Policy)', async () => {
  for (const [view, data] of Object.entries({ ...cases, ...loggedInCases })) {
    const html = await render(view, locals(USERS.admin, data()));
    assert.doesNotMatch(html, /<script>(?!\s*<\/script>)/, `${view} has an inline <script>`);
    assert.doesNotMatch(html, /\son[a-z]+="/, `${view} has an inline event handler`);
  }
});

test('register keeps the chosen role and entered values', async () => {
  const html = await render('register', locals(null, cases.register()));
  assert.match(html, /<option value="student"\s+selected>/);
});
