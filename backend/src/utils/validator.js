const { body, param, query, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// Sanitization middleware for HTML content
const sanitizeInput = (fields) => {
    return (req, res, next) => {
        fields.forEach((field) => {
            if (req.body[field]) {
                req.body[field] = sanitizeHtml(req.body[field], {
                    allowedTags: [], // Remove all HTML tags
                    allowedAttributes: {},
                    disallowedTagsMode: 'discard',
                });
            }
        });
        next();
    };
};

// Validation result handler
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
            })),
        });
    }
    next();
};

// Email validation rule
const emailRule = () => {
    return body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail({
            gmail_remove_dots: false,
            gmail_remove_subaddress: true,
            all_lowercase: true,
        })
        .notEmpty()
        .withMessage('Email is required')
        .isLength({ max: 255 })
        .withMessage('Email cannot exceed 255 characters');
};

// Name validation rule
const nameRule = () => {
    return body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters');
};

// Message validation rule
const messageRule = () => {
    return body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Message must be between 10 and 5000 characters');
};

// Subject validation rule
const subjectRule = () => {
    return body('subject')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Subject cannot exceed 200 characters');
};

// ID validation rule
const idRule = (paramName = 'id') => {
    return param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`);
};

// Slug validation rule
const slugRule = () => {
    return param('slug')
        .trim()
        .isSlug()
        .withMessage('Invalid slug format');
};

// Pagination validation
const paginationRule = () => {
    return [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer')
            .toInt(),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
            .toInt(),
    ];
};

module.exports = {
    sanitizeInput,
    validate,
    emailRule,
    nameRule,
    messageRule,
    subjectRule,
    idRule,
    slugRule,
    paginationRule,
};
