import crypto from 'crypto';

interface AuthParams {
  getUserFn?: () => void;
  validatePasswordFn?: () => void;
  storeRefreshTokenFn?: () => void;
  getStoredRefreshTokenFn?: () => void;
  deleteStoredRefreshTokenFn?: () => void;
  checkUserPermissionsFn?: (req: any, res: any, next: any) => any;
  restrictToOwnerFn?: () => (req: any, res: any, next: any) => any;
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

abstract class EnduranceAuth {
  protected isInitialized = false;
  protected getUserById: (...args: any[]) => void = (...args) => { throw new Error('getUserById not implemented'); };
  protected validatePassword: (...args: any[]) => void = (...args) => { throw new Error('validatePassword not implemented'); };
  protected storeRefreshToken: (...args: any[]) => void = (...args) => { };
  protected getStoredRefreshToken: (...args: any[]) => void = (...args) => { };
  protected deleteStoredRefreshToken: (...args: any[]) => void = (...args) => { };
  protected checkUserPermissions: (...args: any[]) => void = (...args) => { };
  protected restrictToOwner: (...args: any[]) => void = (...args) => { };
  protected authenticateLocalAndGenerateTokens: (...args: any[]) => void = (...args) => { };
  protected authenticateAzureAndGenerateTokens: (...args: any[]) => void = (...args) => { };
  protected generateAzureTokens: (...args: any[]) => void = (...args) => { };
  protected refreshJwt: (...args: any[]) => void = (...args) => { };
  protected revokeRefreshToken: (...args: any[]) => void = (...args) => { };
  protected isAuthenticated: (...args: any[]) => void = (...args) => { };
  protected authorize: (...args: any[]) => void = (...args) => { };
  protected generateToken: (...args: any[]) => void = (...args) => { throw new Error('generateToken not implemented'); };
  protected handleAuthError: (err: any, req: any, res: any, next: any) => void = (err, req, res, next) => res.status(401).json({ message: err.message });

  public generateRefreshToken = (...args: any[]): string => crypto.randomBytes(40).toString('hex');

  public asyncHandler = (fn: (req: any, res: any, next: any) => Promise<void>) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  public initializeAuth(params: AuthParams = {}) {
    if (this.isInitialized) {
      console.warn('[Auth] Auth module is already initialized.');
      return;
    }

    console.log('[Auth] Initializing auth module...');

    this.getUserById = params.getUserFn || this.getUserById;
    this.validatePassword = params.validatePasswordFn || this.validatePassword;
    this.storeRefreshToken = params.storeRefreshTokenFn || this.storeRefreshToken;
    this.getStoredRefreshToken = params.getStoredRefreshTokenFn || this.getStoredRefreshToken;
    this.deleteStoredRefreshToken = params.deleteStoredRefreshTokenFn || this.deleteStoredRefreshToken;
    this.checkUserPermissions = params.checkUserPermissionsFn || this.checkUserPermissions;
    this.restrictToOwner = params.restrictToOwnerFn || this.restrictToOwner;
    this.authenticateLocalAndGenerateTokens = params.authenticateLocalAndGenerateTokensFn || this.authenticateLocalAndGenerateTokens;
    this.authenticateAzureAndGenerateTokens = params.authenticateAzureAndGenerateTokensFn || this.authenticateAzureAndGenerateTokens;
    this.generateAzureTokens = params.generateAzureTokensFn || this.generateAzureTokens;
    this.refreshJwt = params.refreshJwtFn || this.refreshJwt;
    this.revokeRefreshToken = params.revokeRefreshTokenFn || this.revokeRefreshToken;
    this.isAuthenticated = params.authenticateJwtFn || this.isAuthenticated;
    this.authorize = params.authorizeFn || this.authorize;
    this.generateToken = params.generateTokenFn || this.generateToken;
    this.handleAuthError = params.handleAuthErrorFn || this.handleAuthError;

    if (typeof params.configureJwtStrategyFn === 'function') params.configureJwtStrategyFn();
    if (typeof params.configureLocalStrategyFn === 'function') params.configureLocalStrategyFn();
    if (typeof params.configureAzureStrategyFn === 'function') params.configureAzureStrategyFn();
    if (typeof params.configureAzureJwtStrategyFn === 'function') params.configureAzureJwtStrategyFn();

    this.isInitialized = true;
    console.log('[Auth] Auth middleware initialized successfully.');
  }

  public accessControl = {
    checkUserPermissions: (...args: any[]) => this.checkUserPermissions(...args),
    restrictToOwner: (...args: any[]) => this.restrictToOwner(...args),
    authorize: (...args: any[]) => this.authorize(...args),
    isAuthenticated: (...args: any[]) => this.isAuthenticated(...args)
  };

  public auth = {
    initializeAuth: this.initializeAuth.bind(this),
    getUserById: (...args: any[]) => this.getUserById(...args),
    validatePassword: (...args: any[]) => this.validatePassword(...args),
    storeRefreshToken: (...args: any[]) => this.storeRefreshToken(...args),
    getStoredRefreshToken: (...args: any[]) => this.getStoredRefreshToken(...args),
    deleteStoredRefreshToken: (...args: any[]) => this.deleteStoredRefreshToken(...args),
    authenticateLocalAndGenerateTokens: (...args: any[]) => this.authenticateLocalAndGenerateTokens(...args),
    authenticateAzureAndGenerateTokens: (...args: any[]) => this.authenticateAzureAndGenerateTokens(...args),
    generateAzureTokens: (...args: any[]) => this.generateAzureTokens(...args),
    refreshJwt: (...args: any[]) => this.refreshJwt(...args),
    revokeRefreshToken: (...args: any[]) => this.revokeRefreshToken(...args),
    isAuthenticated: (...args: any[]) => this.isAuthenticated(...args),
    generateToken: (...args: any[]) => this.generateToken(...args),
    generateRefreshToken: (...args: any[]) => this.generateRefreshToken(...args),
    handleAuthError: (err: any, req: any, res: any, next: any) => this.handleAuthError(err, req, res, next),
    asyncHandler: this.asyncHandler
  };
}

export { EnduranceAuth };
