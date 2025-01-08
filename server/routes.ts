import type { Express } from "express";
import { createServer, type Server } from "http";

// Mock data store
let users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

export function registerRoutes(app: Express): Server {
  // GET /api/users - List all users
  app.get('/api/users', (req, res) => {
    res.json(users);
  });

  // POST /api/users - Create a new user
  app.post('/api/users', (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
    };

    users.push(newUser);
    res.status(201).json(newUser);
  });

  const httpServer = createServer(app);
  return httpServer;
}