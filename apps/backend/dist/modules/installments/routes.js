"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installmentsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.installmentsRouter = router;
router.use(auth_1.authMiddleware);
router.get('/:loanId/installments', controller_1.getInstallments);
router.patch('/:id/pay', controller_1.payInstallment);
router.patch('/:id/status', controller_1.updateInstallmentStatus);
//# sourceMappingURL=routes.js.map