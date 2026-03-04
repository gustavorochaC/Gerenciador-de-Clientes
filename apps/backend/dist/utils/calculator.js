"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLoan = calculateLoan;
exports.generateInstallmentDates = generateInstallmentDates;
function calculateLoan(principal, rate, installments) {
    const totalInterest = principal * (rate / 100) * installments;
    const totalAmount = principal + totalInterest;
    const installmentAmount = totalAmount / installments;
    return {
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
    };
}
function generateInstallmentDates(startDate, dueDay, count) {
    const dates = [];
    const start = new Date(startDate + 'T00:00:00');
    let currentMonth = start.getMonth();
    let currentYear = start.getFullYear();
    // First installment due in the next month from start date
    currentMonth += 1;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
    }
    for (let i = 0; i < count; i++) {
        const month = currentMonth + i;
        const year = currentYear + Math.floor(month / 12);
        const m = month % 12;
        // Use dueDay, but clamp to the max days of the month
        const maxDays = new Date(year, m + 1, 0).getDate();
        const day = Math.min(dueDay, maxDays);
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(dateStr);
    }
    return dates;
}
//# sourceMappingURL=calculator.js.map