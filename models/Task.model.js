const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type : String,
        required: true,
        trim: true
    },
    description: 
    {
        type : String,
        default : ''
    },
    completed:
    {
        type: Boolean,
        default: false
    },
    priority: 
    {
        type : String, 
        enum : ['low', 'medium', 'high'],
        default : 'medium' 
    },

    tags: 
    {
        type : [String],
        default: []
    },
    dueDate: 
    {
        type: Date,
        default: null
    },
    owner: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    }],
    attachments: [{
        filename: String,
        url: String,
        mimeType: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
},
{ timestamps : true }
);
  
taskSchema.index({ owner : 1, priority : 1, completed: 1});
taskSchema.index({ owner : 1, tags: 1});
taskSchema.index({owner: 1, dueDate: 1});
// taskSchema.index({ tags : 1});
// taskSchema.index({ createdAt : 1});

taskSchema.index({ title : "text", description : "text" });

module.exports = mongoose.model('Task', taskSchema);  