/**
 * Robust date utility functions that avoid timezone-offset bugs with YYYY-MM-DD strings.
 */

export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'string') {
    const match = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }
  const fallback = new Date(dateInput);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDate(dateInput, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = parseDate(dateInput);
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-US', options);
}

export function formatShortDate(dateInput) {
  return formatDate(dateInput, { month: 'short', day: 'numeric' });
}

export function calculateAge(dateInput) {
  if (!dateInput) return null;
  const birthDate = parseDate(dateInput);
  if (!birthDate || isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getUpcomingBirthdays(members, limit = 5) {
  if (!members || !Array.isArray(members)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return members
    .filter(m => m.dateOfBirth && !m.isDobPrivate)
    .map(m => {
      const dob = parseDate(m.dateOfBirth);
      if (!dob || isNaN(dob.getTime())) return null;

      let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      nextBday.setHours(0, 0, 0, 0);

      if (nextBday < today) {
        nextBday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
        nextBday.setHours(0, 0, 0, 0);
      }

      const diffTime = nextBday.getTime() - today.getTime();
      const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const ageThisYear = nextBday.getFullYear() - dob.getFullYear();

      return {
        ...m,
        name: m.fullName,
        date: dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dobStr: dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        relation: m.computedRelation || m.relation,
        daysLeft,
        ageThisYear,
        member: m,
        nextBdayDate: nextBday
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, limit);
}
