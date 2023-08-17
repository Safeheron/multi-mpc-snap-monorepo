const ErrorMessage = {
  UNAUTHORIZED: 'Unauthorized request.',
  NO_MPC: 'MPC Algorithm init failed',
  NO_WALLET: 'Wallet not exists!',
  USER_REJECT: 'User reject!',
  SESSION_INVALID: 'Session invalid!',
}
export default ErrorMessage

export class UserRejectError extends Error {
  constructor() {
    super(ErrorMessage.USER_REJECT)
  }
}
