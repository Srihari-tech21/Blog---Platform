const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb, saveDatabase } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all posts
router.get('/', (req, res) => {
  const db = getDb();
  
  const posts = db.posts.map(post => {
    const user = db.users.find(u => u.id === post.user_id);
    const commentCount = db.comments.filter(c => c.post_id === post.id).length;
    return {
      ...post,
      username: user?.username,
      email: user?.email,
      comment_count: commentCount
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json(posts);
});

// Get single post
router.get('/:id', (req, res) => {
  const db = getDb();
  
  const post = db.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  const user = db.users.find(u => u.id === post.user_id);
  res.json({
    ...post,
    username: user?.username,
    email: user?.email
  });
});

// Create post
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content } = req.body;
  const db = getDb();

  const newPost = {
    id: db.posts.length + 1,
    user_id: req.user.id,
    title,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  db.posts.push(newPost);
  saveDatabase();
  
  res.status(201).json(newPost);
});

// Update post
router.put('/:id', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, content } = req.body;
  const db = getDb();

  const postIndex = db.posts.findIndex(p => p.id === parseInt(req.params.id));
  if (postIndex === -1) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  if (db.posts[postIndex].user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  db.posts[postIndex] = {
    ...db.posts[postIndex],
    title,
    content,
    updated_at: new Date().toISOString()
  };
  
  saveDatabase();
  res.json(db.posts[postIndex]);
});

// Delete post
router.delete('/:id', auth, (req, res) => {
  const db = getDb();

  const postIndex = db.posts.findIndex(p => p.id === parseInt(req.params.id));
  if (postIndex === -1) {
    return res.status(404).json({ message: 'Post not found' });
  }
  
  if (db.posts[postIndex].user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  // Delete comments first
  db.comments = db.comments.filter(c => c.post_id !== parseInt(req.params.id));
  
  // Delete post
  db.posts.splice(postIndex, 1);
  saveDatabase();
  
  res.json({ message: 'Post deleted successfully' });
});

module.exports = router;
