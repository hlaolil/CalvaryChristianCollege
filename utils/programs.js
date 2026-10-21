// utils/programs.js
// Single source of truth for programs of study and application intakes.

const PROGRAMS = [
  { level: 1, title: 'Level 1 Certificate in Christian Discipleship', available: true },
  { level: 2, title: 'Level 2 Diploma in Christian Leadership', available: true },
  { level: 2, title: 'Level 2 Certificate in Theology', available: false },
  { level: 2, title: 'Level 2 Certificate in Biblical Studies', available: false },
  { level: 3, title: 'Level 3 Advanced Diploma in Ministry', available: true },
  { level: 3, title: 'Level 3 Diploma in Theology', available: false },
  { level: 3, title: 'Level 3 Diploma in Biblical Studies', available: false },
  { level: 3, title: 'Level 3 Diploma in Business Leadership', available: false },
  { level: 4, title: 'Level 4 Higher Diploma in Shepherding', available: true },
  { level: 5, title: 'Level 5 Bachelor of Ministry', available: true }
];

// Programs grouped by level, for <optgroup> rendering
function programsByLevel() {
  const groups = new Map();
  PROGRAMS.forEach(p => {
    if (!groups.has(p.level)) groups.set(p.level, []);
    groups.get(p.level).push(p);
  });
  return [...groups.entries()].map(([level, programs]) => ({ level, programs }));
}

function isAvailableProgram(title) {
  return PROGRAMS.some(p => p.title === title && p.available);
}

// Intakes start in January and July. Returns the next `count` intakes after `now`.
function upcomingSemesters(now = new Date(), count = 3) {
  const intakes = [];
  let year = now.getFullYear();
  let month = now.getMonth() < 6 ? 6 : 0; // next intake: July this year, or January next year
  if (month === 0) year += 1;
  while (intakes.length < count) {
    intakes.push(`${month === 0 ? 'January' : 'July'} ${year}`);
    if (month === 0) {
      month = 6;
    } else {
      month = 0;
      year += 1;
    }
  }
  return intakes;
}

module.exports = { PROGRAMS, programsByLevel, isAvailableProgram, upcomingSemesters };
