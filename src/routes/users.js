const express = require('express');

const router = express.Router();

const UsersController = require('../controllers/users');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { paginationMiddleware } = require('../middlewares/paginationMiddleware');

router.get('/all', authMiddleware, paginationMiddleware, UsersController.getAllUsers);

router.get('/:id', UsersController.getUserById);

router.post('/', UsersController.createUser);

router.post('/login', UsersController.loginUser);

router.put('/:id', authMiddleware, UsersController.updateUser);

router.delete('/:id', authMiddleware, UsersController.deactivateUser);

router.get('/all', authMiddleware, UsersController.getAllUsers);

module.exports = router;
