const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const generateTokens = (user) =>
{
    const accessToken = jwt.sign(
        {id: user._id, role: user.role},
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        
    );

    const refreshToken = jwt.sign(
        {id: user._id, role: user.role},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};


// =============================
// REGISTER
// =============================
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      const err = new Error("Name, email, and password are required");
      err.statusCode = 400;
      return next(err);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      return next(err);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


// =============================
// LOGIN
// =============================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error("Email and password required");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      return next(err);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      return next(err);
    }

    // const token = jwt.sign(
        //     {
        //         id: user._id, role: User.role
        //     },
        //     process.env.JWT_SECRET,
        //     {
        //         expiresIn : process.env.JWT_EXPIRES_IN || '1d'
        //     }
        // );

        // return res.json({ 
        //     message : "Login successful",
        //     token,
        //     user : {
        //         id: user._id,
        //         name: user.name,
        //         email: user.email,
        //         role: user.role
        //     }



    // // Access token
    // const accessToken = jwt.sign(
    //   {
    //     id: user._id,
    //     role: user.role,
    //   },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "15m" }
    // );

    // // Refresh token
    // const refreshToken = jwt.sign(
    //   { id: user._id },
    //   process.env.JWT_REFRESH_SECRET,
    //   { expiresIn: "15m" }
    // );

    // // Save refresh token to DB
    // user.refreshToken = refreshToken;
    // await user.save();

    // return res.json({
    //   message: "Login successful",
    //   accessToken,
    //   refreshToken,
    // });

    const token = generateTokens(user);
    
    
    user.refreshToken = token.refreshToken;
   
    console.log("access token expiry in", process.env.JWT_EXPIRES_IN);
    await user.save();

    res.json({
        message: "Login Successful",
        user: {
            id: user._id,
            name: user.name
        },
        accessToken: token.accessToken,
        refreshToken: token.refreshToken
        
    });

  } catch (error) {
    next(error);
  }
};


// =============================
// REFRESH TOKEN
// =============================
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    console.log("Refresh Token:", refreshToken);
    if (!refreshToken) {
      const err = new Error("Refresh token required");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 403;
      return next(err);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = generateTokens(user);

    user.refreshToken = token.refreshToken;
    await user.save();

    //, (error) => {
    //   if (error) {
    //     const err = new Error("Refresh token expired or invalid");
    //     err.statusCode = 403;
    //     return next(err);
    //   }
    // });

    


    // const newAccessToken = jwt.sign(
    //   { id: decoded._id, role: decoded.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "15m" }
    // );

    return res.json({
      message: "Access + Refresh token refreshed",
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};


// =============================
// LOGOUT
// =============================
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;


    if (!refreshToken) {
      const err = new Error("Refresh token required");
      err.statusCode = 400;
      return next(err);
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      const err = new Error("Invalid refresh token");
      err.statusCode = 403;
      return next(err);
    }

    user.refreshToken = null;
    await user.save();

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
