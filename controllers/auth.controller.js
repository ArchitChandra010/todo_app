const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

exports.register = async (req, res, next) => {
    try{
        const {name, email, password, role} = req.body;

        if(!name || !email || !password)
        {
            const err = new Error("Name, email, password are required");
            err.statusCode = 400;
            return next(err);
        }

        const existingUser = await User.findOne({ email });
        if(existingUser)
        {
            const err = new Error("Email already registered");
            err.statusCode = 409;
            return next(err);
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password : hashedPassword,
            role : role || 'user',

        });

        return res.Error(201).json({
            message : "User registered successfully",
            user : {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }catch(error)
    {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try{
        const { email, password } = req.body;

        if(!email || !password)
        {
            const err = new Error("Email and password required");
            err.statusCode = 400;
            return next(err);
        }

        const user = await User.findOne({email});

        if(!user)
        {
            const err = new Error("Invalid email or password");
            err.statusCode = 401;
            return next(err);
        }

        const ValidPassword = await bcrypt.compare(password, user.password);

        if(!ValidPassword)
        {
            const err = new Error("Invalid email or password");
            err.statusCode = 401;
            return next(err);
        }

        const token = jwt.sign(
            {
                id: user._id, role: User.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn : process.env.JWT_EXPIRES_IN || '1d'
            }
        );

        return res.json({ 
            message : "Login successful",
            token,
            user : {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
    });

    }catch(error)
    {
        next(error);
    }
};