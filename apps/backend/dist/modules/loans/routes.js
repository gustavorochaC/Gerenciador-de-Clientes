"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loansRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
exports.loansRouter = router;
router.use(auth_1.authMiddleware);
router.get('/', controller_1.getLoans);
router.get('/:id', controller_1.getLoan);
router.post('/', controller_1.createLoan);
router.put('/:id', controller_1.updateLoan);
router.patch('/:id/status', controller_1.updateLoanStatus);
router.delete('/:id', controller_1.deleteLoan);
//# sourceMappingURL=routes.js.map