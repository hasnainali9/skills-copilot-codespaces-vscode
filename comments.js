// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');
// Create express app
const app = express();
// Use body parser
app.use(bodyParser.json());
// Use cors
app.use(cors());
// Comments object
const commentsByPostId = {};
// Get comments by post id
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});
// Create comment
app.post('/posts/:id/comments', async (req, res) => {
    // Create comment id
    const commentId = randomBytes(4).toString('hex');
    // Get comment content
    const { content } = req.body;
    // Get comments
    const comments = commentsByPostId[req.params.id] || [];
    // Add comment
    comments.push({ id: commentId, content, status: 'pending' });
    // Set comments
    commentsByPostId[req.params.id] = comments;
    // Emit event
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });
    // Send response
    res.status(201).send(comments);
});
// Event handler
app.post('/events', async (req, res) => {
    // Get event type
    const { type, data } = req.body;
    // Check event type
    if (type === 'CommentModerated') {
        // Get comment
        const comment = commentsByPostId[data.postId].find(comment => {
            return comment.id === data.id;
        });
        // Set comment status
        comment.status = data.status;
        // Emit event
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id: data.id,
                content: data.content,
                postId: data.postId,
                status: data.status
            }
        });
    }
    // Send response
    res.send({});
});
// Listen on port 4001
app.listen(4001, () => {
    console.log('Listening on port 4001');
});