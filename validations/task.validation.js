const Joi = require('joi');

/** 
 * Create Task Validation
 */

const createTaskSchema= Joi.object({
    title : Joi.string().trim().min(1).required(),
    description: Joi.string().trim().optional(),
    complemeted: Joi.boolean().optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    dueDate: Joi.date().optional()
}).unknown(false); //disallow extra fields

const updateTaskSchema = Joi.object({
    
    description: Joi.string().trim().optional(),
    completed: Joi.boolean().optional(),
    toggle : Joi.boolean().optional(),
    title : Joi.string().trim().min(1).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    dueDate: Joi.date().optional()
})
.min(1)
.unknown(false); //disallow extra fields

module.exports = {
    createTaskSchema,
    updateTaskSchema    
};