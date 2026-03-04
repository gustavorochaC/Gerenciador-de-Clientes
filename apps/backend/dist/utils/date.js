"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateBR = formatDateBR;
exports.getTodayISO = getTodayISO;
exports.addDays = addDays;
exports.daysBetween = daysBetween;
function formatDateBR(date) {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}
function addDays(date, days) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}
function daysBetween(date1, date2) {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    const diff = d2.getTime() - d1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
//# sourceMappingURL=date.js.map