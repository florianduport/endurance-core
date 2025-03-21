import { EnduranceRouter } from '../lib/router.js';

export class HelloRouter extends EnduranceRouter {
    constructor() {
        super(); // Pas besoin d'authMiddleware pour une route publique
    }

    protected setupRoutes(): void {
        // Route publique hello world
        this.get(
            '/hello',
            { requireAuth: false }, // On désactive l'authentification pour cette route
            (req, res) => {
                res.json({ message: 'Hello World!' });
            }
        );
    }
} 