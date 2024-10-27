import express from 'express';
import payload from 'payload';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

require('dotenv').config();

const app = express();

app.use(express.json()); // Parse JSON request bodies

const JWT_SECRET = process.env.JWT_SECRET || 'my-super-secret';

const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token != null) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) 
        return res.sendStatus(403);

      req.user = user;
      next();
    });
  }
  else {
    res.sendStatus(401);
  }
}

app.post('/register', async (req, res) => {
  const {username, password, email} = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = await payload.create({
    collection: 'users',
    data: {
      username,
      password_hash: passwordHash,
      email,
    },
  });

  res.status(201).json(newUser);
});

app.post('/login', async (req, res) => {
  const {username, password} = req.body;

  const users = await payload.find({
    collection: 'users',
    where: {username},
  });

  if(users.docs.length > 0 && await bcrypt.compare(password, users.docs[0].password_hash)) {
    const user = users.docs[0];
    const token = jwt.sign({username: user.username}, JWT_SECRET ,{
      expiresIn: '1d',
    });
    res.json({token});
  }
  else {
    res.sendStatus(401);
  }
});

app.get('/', (_, res) => {
  res.redirect('/admin');
});

app.use(authenticateJWT);

const start = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  app.post('/tasks', async (req, res) => {
    try {
      console.log("Creating task");
      const task = await payload.create({
        collection: 'tasks',
        data: req.body,
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // /tasks?user=<userId>
  app.get('/tasks', async (req, res) => {
    const { user } = req.query;
    try {
      const tasks = await payload.find({
        collection: 'tasks',
        where: { user: { equals: user } },
      });
      res.status(200).json(tasks.docs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // /tasks/:id
  app.put('/tasks/:id', async (req, res) => {
    try {
      const updatedTask = await payload.update({
        collection: 'tasks',
        id: req.params.id,
        data: req.body,
      });
      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // /tasks/:id
  app.delete('/tasks/:id', async (req, res) => {
    try {
      await payload.delete({
        collection: 'tasks',
        id: req.params.id,
      });
      res.status(204).json({
        message: 'Task deleted',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(process.env.PORT || 8080);
};

start();

