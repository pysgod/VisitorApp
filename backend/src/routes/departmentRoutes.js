const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus
} = require('../controllers/departmentController');
const { protect, adminOnly } = require('../middleware/auth');

// Public route - personeller de departman listesine erişebilmeli
router.get('/', protect, getAllDepartments);

// Admin only routes
router.use(protect);
router.use(adminOnly);

router.post('/', createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(updateDepartment)
  .delete(deleteDepartment);

router.put('/:id/toggle', toggleDepartmentStatus);

module.exports = router;
