const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// 1. GET ALL COMMENTS FOR A SPECIFIC POST
router.get('/:postId', async (req, res) => {
  try {
    // Find all comments where the postId matches the one in the URL
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// 2. CREATE A NEW COMMENT ON A POST
router.post('/', async (req, res) => {
  try {
    const { postId, author, content } = req.body;
    
    const newComment = new Comment({
      postId,
      author,
      content
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating comment', error: error.message });
  }
});

// 3. DELETE A COMMENT
router.delete('/:id', async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) return res.status(404).json({ message: 'Comment not found' });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
});

module.exports = router;