const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');
const crypto = require('crypto');

const createAuthModule = () => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';

  let getUserById;
  let validatePassword;
  let storeRefreshToken;
  let getStoredRefreshToken;
  let deleteStoredRefreshToken;
  let checkUserPermissions = () => (req, res, next) => next();
  let restrictToOwner = () => (req, res, next) => next();

  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  const configureJwtStrategy = () => {
    passport.use(
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: secret,
        },
        async (jwtPayload, done) => {
          try {
            const user = await getUserById(jwtPayload.id);
            if (user) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
  };

  const configureLocalStrategy = () => {
    passport.use(
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password',
        },
        async (email, password, done) => {
          try {
            const user = await getUserById({ email });
            if (!user || !(await validatePassword(user, password))) {
              return done(null, false, { message: 'Incorrect email or password.' });
            }
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  };

  const initializeAuth = (
    getUserFn,
    validatePasswordFn,
    storeRefreshTokenFn,
    getStoredRefreshTokenFn,
    deleteStoredRefreshTokenFn
  ) => {
    if (typeof getUserFn !== 'function' || typeof validatePasswordFn !== 'function') {
      throw new Error(
        'initializeAuth requires getUserById and validatePassword functions as arguments'
      );
    }
    getUserById = getUserFn;
    validatePassword = validatePasswordFn;
    storeRefreshToken = storeRefreshTokenFn;
    getStoredRefreshToken = getStoredRefreshTokenFn;
    deleteStoredRefreshToken = deleteStoredRefreshTokenFn;
    configureJwtStrategy();
    configureLocalStrategy();
  };

  const generateToken = (user) => {
    if (!user || !user.id || !user.email) {
      throw new Error('generateToken requires a user object with id and email');
    }
    return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '15m' });
  };

  const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
  };

  const authenticateJWT = () => {
    return passport.authenticate('jwt', { session: false });
  };

  const authenticateAndGenerateTokens = () => {
    return asyncHandler((req, res, next) => {
      passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err || !user) {
          return res.status(400).json({
            message: 'Something is not right',
            user: user,
          });
        }
        req.login(user, { session: false }, async (err) => {
          if (err) {
            res.send(err);
          }
          const token = generateToken(user);
          const refreshToken = generateRefreshToken();

          await storeRefreshToken(user.id, refreshToken);

          return res.json({ token, refreshToken });
        });
      })(req, res, next);
    });
  };

  const refreshJWT = () => {
    return asyncHandler(async (req, res) => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      try {
        const storedRefreshToken = await getStoredRefreshToken(refreshToken);
        if (!storedRefreshToken) {
          return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const user = await getUserById(storedRefreshToken.userId);
        if (!user) {
          return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const newToken = generateToken(user);

        return res.json({ token: newToken });
      } catch (err) {
        return res.status(500).json({ message: 'Error refreshing token', error: err.message });
      }
    });
  };

  const revokeRefreshToken = () => {
    return asyncHandler(async (req, res) => {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      try {
        await deleteStoredRefreshToken(refreshToken);
        return res.status(200).json({ message: 'Refresh token revoked' });
      } catch (err) {
        return res.status(500).json({ message: 'Error revoking refresh token', error: err.message });
      }
    });
  };

  const authorize = (checkPermissionsFn) => {
    return async (req, res, next) => {
      try {
        const hasPermission = await checkPermissionsFn(req.user, req);

        if (!hasPermission) {
          return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        next();
      } catch (err) {
        res.status(500).json({ message: 'Authorization error', error: err.message });
      }
    };
  };

  const handleAuthError = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({ message: 'Invalid or expired token' });
    } else {
      next(err);
    }
  };

  return {
    initializeAuth,
    generateToken,
    authenticateJWT: () => asyncHandler(authenticateJWT()),
    authenticateAndGenerateTokens,
    refreshJWT,
    revokeRefreshToken,
    authorize,
    handleAuthError,
    checkUserPermissions,
    restrictToOwner,
  };
};

const authInstance = createAuthModule();

module.exports = authInstance;
