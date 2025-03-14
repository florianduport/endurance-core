import crypto from 'crypto';

interface AuthParams {
  getUserFn?: () => void;
  validatePasswordFn?: () => void;
  storeRefreshTokenFn?: () => void;
  getStoredRefreshTokenFn?: () => void;
  deleteStoredRefreshTokenFn?: () => void;
  checkUserPermissionsFn?: () => (req: any, res: any, next: any) => void;
  restrictToOwnerFn?: () => (req: any, res: any, next: any) => void;
  authenticateLocalAndGenerateTokensFn?: () => (req: any, res: any, next: any) => void;
  authenticateAzureAndGenerateTokensFn?: () => (req: any, res: any, next: any) => void;
  generateAzureTokensFn?: () => (req: any, res: any, next: any) => void;
  refreshJwtFn?: () => (req: any, res: any) => void;
  revokeRefreshTokenFn?: () => (req: any, res: any) => void;
  authenticateJwtFn?: () => (req: any, res: any, next: any) => void;
  authorizeFn?: () => (req: any, res: any, next: any) => void;
  generateTokenFn?: () => void;
  handleAuthErrorFn?: (err: any, req: any, res: any, next: any) => void;
  configureJwtStrategyFn?: () => void;
  configureLocalStrategyFn?: () => void;
  configureAzureStrategyFn?: () => void;
  configureAzureJwtStrategyFn?: () => void;
}

const authModule = (() => {
  let isInitialized = false;

  let getUserById: (...args: any[]) => void = (...args) => { throw new Error('getUserById not implemented'); };
  let validatePassword: (...args: any[]) => void = (...args) => { throw new Error('validatePassword not implemented'); };
  let storeRefreshToken: (...args: any[]) => void = (...args) => { };
  let getStoredRefreshToken: (...args: any[]) => void = (...args) => { };
  let deleteStoredRefreshToken: (...args: any[]) => void = (...args) => { };
  let checkUserPermissions: (...args: any[]) => void = (...args) => { };
  let restrictToOwner: (...args: any[]) => void = (...args) => { };
  let authenticateLocalAndGenerateTokens: (...args: any[]) => void = (...args) => { };
  let authenticateAzureAndGenerateTokens: (...args: any[]) => void = (...args) => { };
  let generateAzureTokens: (...args: any[]) => void = (...args) => { };
  let refreshJwt: (...args: any[]) => void = (...args) => { };
  let revokeRefreshToken: (...args: any[]) => void = (...args) => { };
  let isAuthenticated: (...args: any[]) => void = (...args) => { };
  let authorize: (...args: any[]) => void = (...args) => { };
  let generateToken: (...args: any[]) => void = (...args) => { throw new Error('generateToken not implemented'); };
  const generateRefreshToken = (...args: any[]): string => crypto.randomBytes(40).toString('hex');
  let handleAuthError: (err: any, req: any, res: any, next: any) => void = (err, req, res, next) => res.status(401).json({ message: err.message });

  const asyncHandler = (fn: (req: any, res: any, next: any) => Promise<void>) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  const initializeAuth = (params: AuthParams = {}) => {
    if (isInitialized) {
      console.warn('[Auth] Auth module is already initialized.');
      return;
    }

    console.log('[Auth] Initializing auth module...');

    getUserById = params.getUserFn || getUserById;
    validatePassword = params.validatePasswordFn || validatePassword;
    storeRefreshToken = params.storeRefreshTokenFn || storeRefreshToken;
    getStoredRefreshToken = params.getStoredRefreshTokenFn || getStoredRefreshToken;
    deleteStoredRefreshToken = params.deleteStoredRefreshTokenFn || deleteStoredRefreshToken;
    checkUserPermissions = params.checkUserPermissionsFn || checkUserPermissions;
    restrictToOwner = params.restrictToOwnerFn || restrictToOwner;
    authenticateLocalAndGenerateTokens = params.authenticateLocalAndGenerateTokensFn || authenticateLocalAndGenerateTokens;
    authenticateAzureAndGenerateTokens = params.authenticateAzureAndGenerateTokensFn || authenticateAzureAndGenerateTokens;
    generateAzureTokens = params.generateAzureTokensFn || generateAzureTokens;
    refreshJwt = params.refreshJwtFn || refreshJwt;
    revokeRefreshToken = params.revokeRefreshTokenFn || revokeRefreshToken;
    isAuthenticated = params.authenticateJwtFn || isAuthenticated;
    authorize = params.authorizeFn || authorize;
    generateToken = params.generateTokenFn || generateToken;
    handleAuthError = params.handleAuthErrorFn || handleAuthError;

    if (typeof params.configureJwtStrategyFn === 'function') params.configureJwtStrategyFn();
    if (typeof params.configureLocalStrategyFn === 'function') params.configureLocalStrategyFn();
    if (typeof params.configureAzureStrategyFn === 'function') params.configureAzureStrategyFn();
    if (typeof params.configureAzureJwtStrategyFn === 'function') params.configureAzureJwtStrategyFn();

    isInitialized = true;
    console.log('[Auth] Auth middleware initialized successfully.');
  };

  const accessControl = {
    checkUserPermissions: (...args: any[]) => checkUserPermissions(...args),
    restrictToOwner: (...args: any[]) => restrictToOwner(...args),
    authorize: (...args: any[]) => authorize(...args),
    isAuthenticated: (...args: any[]) => isAuthenticated(...args)
  };

  const auth = {
    initializeAuth,
    getUserById: (...args: any[]) => getUserById(...args),
    validatePassword: (...args: any[]) => validatePassword(...args),
    storeRefreshToken: (...args: any[]) => storeRefreshToken(...args),
    getStoredRefreshToken: (...args: any[]) => getStoredRefreshToken(...args),
    deleteStoredRefreshToken: (...args: any[]) => deleteStoredRefreshToken(...args),
    authenticateLocalAndGenerateTokens: (...args: any[]) => authenticateLocalAndGenerateTokens(...args),
    authenticateAzureAndGenerateTokens: (...args: any[]) => authenticateAzureAndGenerateTokens(...args),
    generateAzureTokens: (...args: any[]) => generateAzureTokens(...args),
    refreshJwt: (...args: any[]) => refreshJwt(...args),
    revokeRefreshToken: (...args: any[]) => revokeRefreshToken(...args),
    isAuthenticated: (...args: any[]) => isAuthenticated(...args),
    generateToken: (...args: any[]) => generateToken(...args),
    generateRefreshToken: (...args: any[]) => generateRefreshToken(...args),
    handleAuthError: (err: any, req: any, res: any, next: any) => handleAuthError(err, req, res, next),
    asyncHandler
  };

  return {
    accessControl,
    auth
  };
})();

export const { accessControl, auth } = authModule;
