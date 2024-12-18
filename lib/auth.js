import crypto from 'crypto';

const authModule = (() => {
  let isInitialized = false;

  let getUserById = () => { throw new Error('getUserById not implemented'); };
  let validatePassword = () => { throw new Error('validatePassword not implemented'); };
  let storeRefreshToken = () => {};
  let getStoredRefreshToken = () => {};
  let deleteStoredRefreshToken = () => {};
  let checkUserPermissions = () => (req, res, next) => next();
  let restrictToOwner = () => (req, res, next) => next();
  let authenticateLocalAndGenerateTokens = () => (req, res, next) => next();
  let authenticateAzureAndGenerateTokens = () => (req, res, next) => next();
  let generateAzureTokens = () => (req, res, next) => next();
  let refreshJwt = () => (req, res) => res.status(501).json({ message: 'refreshJwt not implemented' });
  let revokeRefreshToken = () => (req, res) => res.status(501).json({ message: 'revokeRefreshToken not implemented' });
  let isAuthenticated = () => (req, res, next) => next(); // Renamed from authenticateJwt
  let authorize = () => (req, res, next) => next();
  let generateToken = () => { throw new Error('generateToken not implemented'); };
  let generateRefreshToken = () => crypto.randomBytes(40).toString('hex');
  let handleAuthError = (err, req, res, next) => res.status(401).json({ message: err.message });

  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  const initializeAuth = (params = {}) => {
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
    isAuthenticated = params.authenticateJwtFn || isAuthenticated; // Renamed from authenticateJwt
    authorize = params.authorizeFn || authorize;
    generateToken = params.generateTokenFn || generateToken;
    handleAuthError = params.handleAuthErrorFn || handleAuthError;

    if (typeof params.configureJwtStrategyFn === 'function') params.configureJwtStrategyFn();
    if (typeof params.configureLocalStrategyFn === 'function') params.configureLocalStrategyFn();
    if (typeof params.configureAzureStrategyFn === 'function') params.configureAzureStrategyFn();

    isInitialized = true;
    console.log('[Auth] Auth middleware initialized successfully.');
  };

  const accessControl = {
    checkUserPermissions: (...args) => checkUserPermissions(...args),
    restrictToOwner: (...args) => restrictToOwner(...args),
    authorize: (...args) => authorize(...args),
    isAuthenticated: (...args) => isAuthenticated(...args), // Added to accessControl
  };

  const auth = {
    initializeAuth,
    getUserById: (...args) => getUserById(...args),
    validatePassword: (...args) => validatePassword(...args),
    storeRefreshToken: (...args) => storeRefreshToken(...args),
    getStoredRefreshToken: (...args) => getStoredRefreshToken(...args),
    deleteStoredRefreshToken: (...args) => deleteStoredRefreshToken(...args),
    authenticateLocalAndGenerateTokens: (...args) => authenticateLocalAndGenerateTokens(...args),
    authenticateAzureAndGenerateTokens: (...args) => authenticateAzureAndGenerateTokens(...args),
    generateAzureTokens: (...args) => generateAzureTokens(...args),
    refreshJwt: (...args) => refreshJwt(...args),
    revokeRefreshToken: (...args) => revokeRefreshToken(...args),
    isAuthenticated: (...args) => isAuthenticated(...args), // Renamed from authenticateJwt
    generateToken: (...args) => generateToken(...args),
    generateRefreshToken: (...args) => generateRefreshToken(...args),
    handleAuthError: (...args) => handleAuthError(...args),
    asyncHandler,
  };

  return {
    accessControl,
    auth,
  };
})();

export const { accessControl, auth } = authModule;