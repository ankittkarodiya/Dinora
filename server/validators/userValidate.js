const yup = require('yup');

const userSchema = yup.object({
    username:yup
    .string()
    .trim()
    .min(4, "username must be atleast of 4 characters")
    .required(),
    email: yup.string()
    .email("The email is not valid one")
    .required(),
    password: yup
    .string()
    .min(4, "password must be atleast 4 characters")
    .required()
})

const validateUser = (schema) => async(req, res, next) => {
    try {
        await schema.validate(req.body);

        next();

    } catch (err) {
        return res.status(400).json({
            success: false,
            errors: err.errors
        })
    }
}

module.exports = { userSchema, validateUser }