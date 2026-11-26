export const authEndpoints = {
  login: "/auth",
  register: "/auth/register",
  registerIndividual: "/reg",
  registerBusiness: "/reg",
  requestOtp: "/otp",
  verifyOtp: "/verify",
  logout: "/auth/logout",
  me: "/auth/me",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
} as const;
