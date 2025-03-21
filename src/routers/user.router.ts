import { EnduranceBaseRouter } from '../lib/router.js';
import { UserModel } from '../models/user.model.js';
import { EnduranceAuthMiddleware } from '../lib/auth.js';

export class UserRouter extends EnduranceBaseRouter {
    constructor(authMiddleware: EnduranceAuthMiddleware) {
        super(authMiddleware, { requireDb: true });
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Route publique pour la création de compte
        this.post(
            '/register',
            { requireAuth: false },
            async (req, res) => {
                // Logique d'inscription
            }
        );

        // Route publique pour la connexion
        this.post(
            '/login',
            { requireAuth: false },
            async (req, res) => {
                // Logique de connexion
            }
        );

        // Route protégée pour obtenir le profil de l'utilisateur connecté
        this.get(
            '/profile',
            {
                requireAuth: true,
                checkOwnership: true
            },
            async (req, res) => {
                // Logique pour récupérer le profil
            }
        );

        // Route protégée pour les administrateurs
        this.get(
            '/admin/users',
            {
                requireAuth: true,
                permissions: ['MANAGE_USERS']
            },
            async (req, res) => {
                // Logique pour la gestion des utilisateurs
            }
        );

        // AutoWire pour les opérations CRUD basiques sur les utilisateurs
        this.autoWireSecure(
            UserModel,
            'User',
            {
                requireAuth: true,
                checkOwnership: true,
                permissions: ['MANAGE_USERS']
            }
        );
    }
} 