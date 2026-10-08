import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, restaurantId, phone } = req.body;
    const result = await authService.register({ name, email, password, role, restaurantId, phone });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Current user profile retrieved',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear client auth token.',
  });
};

export const seedDemo = async (req, res, next) => {
  try {
    const result = await authService.seedInitialAccounts();
    res.status(200).json({
      success: true,
      message: 'Demo accounts status',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
