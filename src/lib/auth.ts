import { Request, Response, NextFunction } from 'express';

abstract class EnduranceAccessControl {
  public checkUserPermissions = (
    permissions: string[],
    req: Request,
    res: Response,
    next: NextFunction
  ): void => this.checkUserPermissions(permissions, req, res, next);

  public restrictToOwner = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => this.restrictToOwner(req, res, next);

  public authorize = (...args: any[]): void => this.authorize(...args);
  public isAuthenticated = (...args: any[]): void => this.isAuthenticated(...args);
  public handleAuthError = (err: any, req: any, res: any, next: any): void => this.handleAuthError(err, req, res, next);
  public asyncHandler = (fn: (req: any, res: any, next: any) => Promise<void>) => (req: any, res: any, next: any): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

abstract class EnduranceAuth {
  public getUserById = (...args: any[]): void => this.getUserById(...args);
  public validatePassword = (...args: any[]): void => this.validatePassword(...args);
  public storeRefreshToken = (...args: any[]): void => this.storeRefreshToken(...args);
  public getStoredRefreshToken = (...args: any[]): void => this.getStoredRefreshToken(...args);
  public deleteStoredRefreshToken = (...args: any[]): void => this.deleteStoredRefreshToken(...args);
  public authenticateLocalAndGenerateTokens = (...args: any[]): void => this.authenticateLocalAndGenerateTokens(...args);
  public authenticateAzureAndGenerateTokens = (...args: any[]): void => this.authenticateAzureAndGenerateTokens(...args);
  public generateAzureTokens = (...args: any[]): void => this.generateAzureTokens(...args);
  public refreshJwt = (...args: any[]): void => this.refreshJwt(...args);
  public revokeRefreshToken = (...args: any[]): void => this.revokeRefreshToken(...args);
  public isAuthenticated = (...args: any[]): void => this.isAuthenticated(...args);
  public generateToken = (...args: any[]): void => this.generateToken(...args);
  public generateRefreshToken = (...args: any[]): string => this.generateRefreshToken(...args);
  public handleAuthError = (err: any, req: any, res: any, next: any): void => this.handleAuthError(err, req, res, next);
  public asyncHandler = (fn: (req: any, res: any, next: any) => Promise<void>) => (req: any, res: any, next: any): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

abstract class EnduranceAuthMiddleware {
  public accessControl: EnduranceAccessControl;
  public auth: EnduranceAuth;

  constructor(accessControlInstance: EnduranceAccessControl, authInstance: EnduranceAuth) {
    this.accessControl = accessControlInstance;
    this.auth = authInstance;
  }
}

export { EnduranceAuthMiddleware, EnduranceAccessControl, EnduranceAuth };
