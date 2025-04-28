/**
 * Calculates the current sprint number based on the start date of the first sprint
 * and the length of the sprints.
 *
 * @param firstSprintStartDate - The start date of the very first sprint (Sprint 1). If undefined, the function returns 1.
 * @param sprintLengthDays - The duration of each sprint in days. Defaults to 14 if not provided.
 * @returns The calculated current sprint number (1-based index). Returns 1 if firstSprintStartDate is not provided or if today is before the firstSprintStartDate.
 */
export const calculateCurrentSprint = (firstSprintStartDate: Date, sprintLengthDays: number): number => {
    // --- Calculate current sprint number ---
    const today = new Date();

    // If today is before the first sprint even started, consider it Sprint 1.
    if (today < firstSprintStartDate) {
        return 1;
    }

    const diffTime = today.getTime() - firstSprintStartDate.getTime(); // Number of full days passed since the start of Sprint 1.
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

    // Calculate the number of full sprints that have passed.
    const sprintsPassed = Math.floor(diffDays / sprintLengthDays);
    // The current sprint number is 1 (for the first sprint) plus the number of full sprints that have passed.
    const currentSprint = sprintsPassed + 1;
    // Return the calculated sprint number (should always be >= 1 based on the logic above).
    return currentSprint;
};

/**
 * Calculates the start date of the current sprint.
 * If the first sprint start date is not provided, it defaults to the most recent Monday.
 *
 * @param firstSprintStartDate - The start date of the very first sprint (Sprint 1). If undefined, the function calculates the most recent Monday and assumes it's the start of the current (and first) sprint.
 * @param sprintLengthDays - The duration of each sprint in days. Defaults to 14 if not provided.
 * @returns The calculated start date of the current sprint. The time part of the date is set to 00:00:00 local time.
 */
export const calculateCurrentSprintStartDate = (firstSprintStartDate: Date, sprintLengthDays: number): Date => {
    // Calculate the current sprint number using the existing helper function
    const currentSprintNumber = calculateCurrentSprint(firstSprintStartDate, sprintLengthDays);

    // Calculate the number of full sprints that have passed before the current one
    // (currentSprintNumber is 1-based, so subtract 1)
    const sprintsBeforeCurrent = currentSprintNumber - 1;

    // Calculate the total number of days from the first sprint start date to the current sprint start date
    const daysToAdd = sprintsBeforeCurrent * sprintLengthDays;

    // Calculate the start date of the current sprint
    const currentSprintStartDate = new Date(firstSprintStartDate.toISOString());
    currentSprintStartDate.setDate(currentSprintStartDate.getUTCDate() + daysToAdd);
    return currentSprintStartDate;
};

/**
 * Calculates the current fiscal quarter based on the fiscal year start date.
 * Quarters are defined as: Q1 (Months 1-3), Q2 (Months 4-6), Q3 (Months 7-9), Q4 (Months 10-12)
 * relative to the fiscal year start.
 *
 * @param fiscalYearStartDate - The start date of the fiscal year. If undefined, returns 1.
 * @returns The current fiscal quarter number (1, 2, 3, or 4).
 */
export const calculateCurrentQuarter = (fiscalYearStartDate: Date): number => {
	  const today = new Date();
    const fiscalStartMonth = fiscalYearStartDate.getUTCMonth(); // 0-11
    const currentMonth = today.getUTCMonth(); // 0-11

    // Calculate the difference in months, handling year wrap-around.
    let monthDiff = currentMonth - fiscalStartMonth;
    if (monthDiff < 0) {
        monthDiff += 12; // Adjust for wrap-around (e.g., fiscal starts in Oct, current is Jan)
    }

    // Determine the quarter based on the 0-based month difference.
    // 0-2 months diff -> Q1
    // 3-5 months diff -> Q2
    // 6-8 months diff -> Q3
    // 9-11 months diff -> Q4
    const quarter = Math.floor(monthDiff / 3) + 1;

    return quarter;
};

/**
 * Calculates the start date of the first sprint (Sprint 1).
 * Given the start date of any sprint, its number, and the length of sprints,
 * it backtracks to find the start date of the very first sprint.
 *
 * @param sprintStartDate - The start date of a known sprint. Defaults to the most recent Monday if not provided.
 * @param sprintNumber - The number (1-based index) of the sprint corresponding to `sprintStartDate`. Defaults to 1 if not provided.
 * @param sprintLengthDays - The duration of each sprint in days. Defaults to 14 if not provided.
 * @returns The calculated start date of the first sprint (Sprint 1).
 */
export const calculateFirstSprintStartDate = (sprintStartDate: Date, sprintNumber: number, sprintLengthDays: number): string => {
   const daysToSubtract = (sprintNumber - 1) * sprintLengthDays;
   const resultDate = new Date(sprintStartDate);
   resultDate.setDate(resultDate.getDate() - daysToSubtract);
   return resultDate.toISOString();
};