const Joi = require('joi');

/** 
 * Create Task Validation
 */

const createTaskSchema= Joi.object({
    title : Joi.string().trim().min(1).required(),
    description: Joi.string().trim().optional(),
    complemeted: Joi.boolean().optional()
}).unknown(false); //disallow extra fields

const updateTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).optional,
    description: Joi.string().trim().optional(),
    completed: Joi.boolean().optional()
})
.min(1)
.unknown(false); //disallow extra fields

module.exports = {
    createTaskSchema,
    updateTaskSchema    
};