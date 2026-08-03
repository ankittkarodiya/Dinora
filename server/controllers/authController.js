const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require('bcryptjs');
const verifyMail = require('../emailVerify/verifyMail');
const sendOtpMail = require('../emailVerify/sendOtpMail');
const crypto = require("crypto");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// registration
// const registerUser = async(req, res) => {
//   try {
//     const {username, email, password, role} = req.body;

//     if(!username || !email || !password){
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required"
//       })
//     }

//     const existingUser = await User.findOne({ username });
//     const existingEmail = await User.findOne({ email });

//     if(existingUser && existingEmail){
//       return res.status(400).json({
//         success: false,
//         message: "username & email already exists"
//       })
//     }
//     if(existingUser){
//       return res.status(400).json({
//         success: false,
//         message: "username already exists"
//       })
//     }
//     if(existingEmail){
//       return res.status(400).json({
//         success: false,
//         message: "email already exists"
//       })
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       username,
//       email,
//       password: hashedPassword,
//       role
//     })
//     await newUser.save();

//     const token = jwt.sign({
//       id: newUser._id},
//       process.env.JWT_SECRET,
//       // {expiresIn:"10m"});
//       {expiresIn: process.env.JWT_TOKEN_EXPIRES_IN
//     });

//     verifyMail(token, email);
//     newUser.token = token;
//     await newUser.save();

//     // status will be 201 whenever something is created
//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       data: newUser
//     })

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// }

const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });

    // ← NEW: if either match exists but was never verified, it's an
    // abandoned signup attempt — delete it and let this registration proceed
    // as if it never happened. A verified user is never touched here.
    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ _id: existingUser._id });
    }
    if (existingEmail && !existingEmail.isVerified && existingEmail._id.toString() !== existingUser?._id?.toString()) {
      await User.deleteOne({ _id: existingEmail._id });
    }

    // re-check AFTER cleanup — only a genuinely verified account blocks registration now
    const stillExistingUser = await User.findOne({ username });
    const stillExistingEmail = await User.findOne({ email });

    if (stillExistingUser && stillExistingEmail) {
      return res.status(400).json({ success: false, message: "username & email already exists" });
    }
    if (stillExistingUser) {
      return res.status(400).json({ success: false, message: "username already exists" });
    }
    if (stillExistingEmail) {
      return res.status(400).json({ success: false, message: "email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN }
    );
    verifyMail(token, email);
    newUser.token = token;
    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// verification
const verification = async(req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing or invalid"
      })
    }

    const token = authHeader.split(" ")[1];
    // console.log("TOKEN:", token);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("SECRET:", process.env.JWT_SECRET);

    } catch (error) {
      if(error.name === 'TokenExpiredError'){
        return res.status(400).json({
          success: false,
          message: "The registration token has expired"
        })
      }

      return res.status(400).json({
        success: false,
        message: "Token verification failed"
      })
    }

    const user = await User.findById(decoded.id);
    // console.log("🔍 Full decoded token payload:", decoded);

    if(!user){
      return res.status(404).json({
          success: false,
          // message: "User not found"

          // ← clearer than a generic "User not found": explains WHY, since
          // this exact case only happens when someone registered again with
          // the same email/username before verifying, which deletes the
          // earlier unverified account this specific link was created for
        message: "This verification link is no longer valid — it looks like you registered again since this email was sent. Please use the most recent verification email, or register again to get a fresh link."
      })
    }

    user.token = null;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email Verified successfully"
    })


  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// loginUser
const loginUser = async(req, res) => {
  try {
    // const {username, email, password, role} = req.body;
    const {email, password, role} = req.body;

    // if(!email || !username || !password){
    if(!email || !password){
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    // const user = await User.findOne( {username} ).select("+password");
    const user = await User.findOne( {email} ).select("+password");
    if(!user){
      return res.status(401).json({
        success: false,
        message: "User doesn't exist"
      })
    }

    const passwordCheck = await bcrypt.compare(password, user.password);
    if(!passwordCheck){
      return res.status(402).json({
        success: false,
        message: "Incorrect password"
      })
    }

    // session
    // ← NEW: generate a fresh session marker on every login
    // this invalidates any token issued before this moment, on any other device
    const sessionToken = crypto.randomBytes(16).toString("hex");
    user.currentSessionToken = sessionToken;
    await user.save();

    // new for isActive filed in user schema
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    // add verification and session later
    // check if user is verified
    if(user.isVerified !== true){
      return res.status(403).json({
          success: false,
          message: "Verify your account then login"
      })
    }

    const accessToken = jwt.sign(
      // {userId: user._id},
      { userId: user._id, sessionToken },   // ← embed it in the JWT payload
      process.env.JWT_SECRET,
      // {expiresIn: "1m"}
      {expiresIn: "30d"} //also safe because of one device login ata a time
    )

    const refreshToken = jwt.sign(
      {userId: user._id},
      process.env.JWT_SECRET,
      {expiresIn: "30d"}
    )

    user.isLoggedIn = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Welcome! ${user.username}`,
      accessToken,
      refreshToken,
      user
    })


  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// logoutUser
const logoutUser = async(req, res) => {
  try {
    // const userId = req.userId;

    // new
    const userId = req.user._id;

    // add session
    await User.findByIdAndUpdate(userId, {isLoggedIn: false});

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    })

    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

const forgetPassword = async (req, res) => {
    try {
      const {email} = req.body;

      if(!email){
        return res.status(400).json({
          success: false,
          message: "Enter email"
        })
      }

      const user = await User.findOne( {email} );
      if(!user){
        return res.status(404).json({
          success: false,
          message: "user doesn't exists"
        })
      }

      const otp = Math.floor(1000 + Math.random()*9000).toString();
      const expiry = new Date(Date.now() + 10*60*1000);

      user.otp = otp;
      user.otpExp = expiry;
      await user.save();
      await sendOtpMail(email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully"
      })

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      })
    }
}

const verifyOtp = async(req, res) => {
  const {otp} = req.body;
  const email = req.params.email;

  if(!otp){
    return res.status(400).json({
        success: false,
        message: "OTP is required"
    })
  }

  try {
    const user = await User.findOne({email});

    if(!user){
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    if(user.otpExp < new Date){
      return res.status(400).json({
        successs: false,
        message: "OTP has expired. Please generate a new one"
      })
    }

    if(otp != user.otp){
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      })
    }

    user.otp = null;
    user.otpExp = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully"
    })

  } catch (error) {
    return res.status(500).json({
      successs: false,
      message: error.message
    })
  }
}

const changePassword = async(req, res) => {
    const {newPassword, confirmPassword} = req.body;
    const email = req.params.email;

    if(!newPassword || !confirmPassword){
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    if(newPassword != confirmPassword){
      return res.status(400).json({
        success: false,
        message: "Password do not match"
      })
    }

  try {
    const user = await User.findOne({email});

    if(!user){
      return res.status(404).json({
        success: false,
        message: "USer not found"
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// module.exports = { registerUser, verification, loginUser, logoutUser, forgetPassword, verifyOtp, changePassword };
module.exports = { registerUser, verification, loginUser, logoutUser, forgetPassword, verifyOtp, changePassword, getMe };