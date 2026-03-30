export const PAPER_TYPES = ["Midterm", "Terminal", "Improve", "Summer"];
export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const START_YEAR = 2021;
const currentYear = new Date().getFullYear();
const END_YEAR = currentYear + 2;

const yearOptions = [];
for (let year = START_YEAR; year <= END_YEAR; year += 1) {
  yearOptions.push(`Fall ${year}`);
  yearOptions.push(`Spring ${year}`);
  yearOptions.push(`Summer ${year}`);
}

export const ACADEMIC_YEARS = yearOptions;
