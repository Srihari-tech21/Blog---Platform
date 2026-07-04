const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb, saveDatabase } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', (req, res) => {
  const db = getDb();
  
  const comments = db.comments
    .filter(c => c.post_id === parseInt(req.params.postId))
    .map(comment => {
      const user = db.users.find(u => u.id === comment.user_id);
      return {
        ...comment,
        username: user?.username,
        email: user?.email
      };
    })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  res.json(comments);
});

// Create comment
router.post('/', auth, [
  body('post_id').isInt().withMessage('Valid post ID required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { post_id, content } = req.body;
  const db = getDb();

  // Check if post exists
  const post = db.posts.find(p => p.id === parseInt(post_id));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const newComment = {
    id: db.comments.length + 1,
    post_id: parseInt(post_id),
    user_id: req.user.id,
    content,
    created_at: new Date().toISOString()
  };
  
  db.comments.push(newComment);
  saveDatabase();

  const user = db.users.find(u => u.id === newComment.user_id);
  res.status(201).json({
    ...newComment,
    username: user?.username,
    email: user?.email
  });
});

// Delete comment
router.delete('/:id', auth, (req, res) => {
  const db = getDb();

  const commentIndex = db.comments.findIndex(c => c.id === parseInt(req.params.id));
  if (commentIndex === -1) {
    return res.status(404).json({ message: 'Comment not found' });
  }
  
  if (db.comments[commentIndex].user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  db.comments.splice(commentIndex, 1);
  saveDatabase();
  
  res.json({ message: 'Comment deleted successfully' });
});

module.exports = router;
