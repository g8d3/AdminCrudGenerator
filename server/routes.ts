import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs/promises";
import path from "path";

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

  // GET /api/schema - Get the OpenAPI schema
  app.get('/api/schema', async (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'attached_assets', 'schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);
      res.json(schema);
    } catch (error) {
      console.error('Error reading schema:', error);
      res.status(500).json({ 
        error: 'Failed to load schema',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/models - Get available models from schema
  app.get('/api/models', async (req, res) => {
    try {
      const schemaPath = path.join(process.cwd(), 'attached_assets', 'schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      // Extract models from schema paths
      const models = Object.keys(schema.paths).filter(path => path !== '/');

      res.json({
        models: models.map(path => ({
          name: path.replace(/^\//, ''), // Remove leading slash
          path: path,
          operations: schema.paths[path]
        }))
      });
    } catch (error) {
      console.error('Error processing models:', error);
      res.status(500).json({ 
        error: 'Failed to process models',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/models/:model - Get specific model details
  app.get('/api/models/:model', async (req, res) => {
    try {
      const { model } = req.params;
      const schemaPath = path.join(process.cwd(), 'attached_assets', 'schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      const modelPath = `/${model}`;
      const modelData = schema.paths[modelPath];

      if (!modelData) {
        return res.status(404).json({ error: `Model ${model} not found` });
      }

      res.json({
        name: model,
        operations: modelData,
        definitions: schema.definitions?.[model]
      });
    } catch (error) {
      console.error(`Error processing model ${req.params.model}:`, error);
      res.status(500).json({ 
        error: 'Failed to process model',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Dynamic route handler for model operations
  app.all('/api/:model', async (req, res) => {
    try {
      const { model } = req.params;
      const schemaPath = path.join(process.cwd(), 'attached_assets', 'schema.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      const modelPath = `/${model}`;
      const modelData = schema.paths[modelPath];

      if (!modelData) {
        return res.status(404).json({ 
          error: 'Not Found',
          message: `Model '${model}' does not exist in the schema`
        });
      }

      // Check if the HTTP method is supported for this model
      const method = req.method.toLowerCase();
      if (!modelData[method]) {
        return res.status(405).json({ 
          error: 'Method Not Allowed',
          message: `${req.method} is not supported for model '${model}'`
        });
      }

      // For now, return a mock response based on the model's schema
      res.json({
        success: true,
        message: `Handled ${req.method} request for model '${model}'`,
        model: modelData[method],
        parameters: modelData[method].parameters,
        responses: modelData[method].responses
      });
    } catch (error) {
      console.error(`Error handling request for ${req.params.model}:`, error);
      res.status(500).json({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}