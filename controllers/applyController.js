// controllers/applyController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');
const { pickFields, missingFields, isValidPhone } = require('../utils/validate');
const { programsByLevel, isAvailableProgram, upcomingSemesters } = require('../utils/programs');
const { paginate, emptyPage } = require('../utils/pagination');

const YES_NO_FIELDS = ['salvation', 'baptism', 'holy_spirit', 'church_member', 'ministerial_credentials'];

const REQUIRED_FIELDS = [
  'phone', 'dob', 'street_address', 'town', 'district', 'postal_code',
  'high_school', 'grad_year', ...YES_NO_FIELDS,
  'current_church_name', 'current_church_city', 'current_church_country',
  'pastor_name', 'church_denomination', 'personal_denomination',
  'ministry_positions', 'national_leader_name',
  'national_leader_position', 'national_leader_address', 'program', 'semester'
];

// Everything the form may submit; any other field in the request is ignored
const FORM_FIELDS = [...REQUIRED_FIELDS, 'country', 'message'];

const STATUSES = ['Pending', 'Approved', 'Rejected'];

async function renderApply(req, res, { error = null, form = {}, existingApplication = null, status = 200 } = {}) {
  const user = req.session.user;
  let applications = [];
  let page = emptyPage('page');

  if (user.role === 'admin') {
    ({ items: applications, page } = await paginate(db.getDb().collection('applications'), {
      sort: { submittedAt: -1 },
      pageParam: 'page',
      req
    }));
  } else if (user.role === 'applicant' && !existingApplication) {
    existingApplication = await db.getDb().collection('applications').findOne({ userId: user.id });
  }

  res.status(status).render('apply', {
    title: 'Application Form',
    applications,
    page,
    existingApplication,
    programGroups: programsByLevel(),
    semesters: upcomingSemesters(),
    yesNoFields: YES_NO_FIELDS,
    form,
    error,
    success: req.query.success === 'true'
  });
}

// GET /apply
exports.getApply = async (req, res, next) => {
  try {
    await renderApply(req, res);
  } catch (err) {
    next(err);
  }
};

function validateApplication(data) {
  if (missingFields(data, REQUIRED_FIELDS).length > 0) return 'Please fill in all required fields.';
  if (!isValidPhone(data.phone)) return 'Invalid phone number. Use the international format, e.g. +266 5812 3456';

  const dob = new Date(data.dob);
  if (isNaN(dob) || dob > new Date()) return 'Please enter a valid date of birth.';

  const gradYear = parseInt(data.grad_year, 10);
  if (!(gradYear >= 1950 && gradYear <= new Date().getFullYear())) return 'Please enter a valid graduation year.';

  if (YES_NO_FIELDS.some(f => !['Yes', 'No'].includes(data[f]))) return 'Please answer all Yes/No questions.';
  if (!isAvailableProgram(data.program)) return 'Please select a program that is currently offered.';
  if (!upcomingSemesters().includes(data.semester)) return 'Please select one of the listed intakes.';
  return null;
}

// POST /apply
exports.postApply = async (req, res, next) => {
  const user = req.session.user;
  const form = pickFields(req.body, FORM_FIELDS);

  try {
    if (user.role !== 'applicant') {
      return renderApply(req, res, { error: 'Only applicants can submit an application.', status: 403 });
    }

    const applications = db.getDb().collection('applications');

    // Prevent duplicate submissions
    const existing = await applications.findOne({ userId: user.id });
    if (existing) {
      return renderApply(req, res, { error: 'You have already submitted an application.', existingApplication: existing });
    }

    const error = validateApplication(form);
    if (error) {
      return renderApply(req, res, { error, form, status: 400 });
    }

    try {
      await applications.insertOne({
        ...form,
        country: 'Lesotho',
        // Identity always comes from the session, never from the form
        userId: user.id,
        name: user.name,
        email: user.email,
        status: 'Pending',
        submittedAt: new Date()
      });
    } catch (err) {
      // The unique index on userId caught a double submit
      if (err.code === 11000) return res.redirect('/apply?success=true');
      throw err;
    }

    res.redirect('/apply?success=true');
  } catch (err) {
    next(err);
  }
};

// POST /apply/:id/status  (admin only)
// Approving an application makes the applicant a student in the chosen program;
// moving it away from Approved again undoes that.
exports.updateApplicationStatus = async (req, res, next) => {
  const { id } = req.params;
  const status = typeof req.body.status === 'string' ? req.body.status : '';
  const back = typeof req.body.returnTo === 'string' && req.body.returnTo.startsWith('?') ? `/apply${req.body.returnTo}` : '/apply';

  if (!STATUSES.includes(status) || !ObjectId.isValid(id)) {
    return res.redirect(back);
  }

  try {
    const database = db.getDb();
    const application = await database.collection('applications').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (application && ObjectId.isValid(application.userId)) {
      const users = database.collection('users');
      const userId = new ObjectId(application.userId);
      if (status === 'Approved') {
        await users.updateOne(
          { _id: userId, role: 'applicant' },
          { $set: { role: 'student', programOfStudy: application.program, promotedFromApplication: id } }
        );
      } else {
        await users.updateOne(
          { _id: userId, role: 'student', promotedFromApplication: id },
          { $set: { role: 'applicant' }, $unset: { programOfStudy: '', promotedFromApplication: '' } }
        );
      }
    }

    res.redirect(back);
  } catch (err) {
    next(err);
  }
};
