import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import sendMail from "../utils/sendMail.js";
// import path from "path";

// import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

import ErrorHandler from "../middlewares/error.js";

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        const file = req.file; 
        let profilePhoto = null;

        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            profilePhoto = cloudResponse.secure_url; 
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exists with this email.',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile: {
                profilePhoto, 
            },
        });

        const subject = "Welcome to CareerConnect!";
        const html = `
            <p>Dear ${fullname},</p>
            <p>Welcome to CareerConnect! You have successfully signed up.</p>
            <p>We are excited to have you on board!</p>
            <p>Best regards,</p>
            <p>The CareerConnect Team</p>
        `;

        sendMail(email,subject,html);

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    try {
        const { role } = req.query; // Get role from query parameters
        
        let users;
        if (role) {
            users = await User.find({ role });
        } else {
            // If no role is specified, return all users
            users = await User.find();
        }

        if (!users || users.length === 0) {
            return next(new ErrorHandler("No users found", 404));
        }

        // Count the number of job seekers and employers
        const jobSeekersCount = await User.countDocuments({ role: "student" });
        const employersCount = await User.countDocuments({ role: "recruiter" });

        res.status(200).json({
            success: true,
            users,  // All users or filtered users based on the query parameter
            jobSeekersCount,  // Number of job seekers
            employersCount,   // Number of employers
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
});




export const login = async (req, res) => {
    try {
        const { email, password, role, secretKey} = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        if(role === "admin"){
            if(secretKey !=process.env.ADMIN_SECRET_KEY){
                return res.status(403).json({message:"Invalid admin secret key", success:false});
            } 
            
            if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
                return res.status(401).json({ message: "Invalid admin credentials", success: false });
             }

             const token = jwt.sign({ email, role }, process.env.SECRET_KEY, { expiresIn: "1d" });
             return res.cookie("token", token, {
               maxAge: 24 * 60 * 60 * 1000,
               httpOnly: true,
               sameSite: "strict",
             }).json({
               message: "Welcome back, Admin!",
               user: { email, role },
               success: true,
             });






        }
        
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }
        
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        };

        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with the current role.",
                success: false
            });
        };

        const tokenData = {
            userId: user._id
        };
        
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        
        const file = req.file;
        let cloudResponse;
        
        if (file) {
            const fileUri = getDataUri(file);
            cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        }

        let skillsArray;
        if (skills) {
            skillsArray = skills.split(",");
        }
        
        const userId = req.id; 
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            });
        }
        
       
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio) user.profile.bio = bio;
        if (skills) user.profile.skills = skillsArray;

       
        if (file) {
            user.profile.profilePhoto = cloudResponse.secure_url; 
        }

        await user.save();

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        return res.status(200).json({
            message: "Profile updated successfully.",
            user,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

// Existing updateProfile function

export const updateResume = async (req, res) => {
    
  if (!token) {
    setError('Please log in first');
    return;
  }

  if (!file) {
    setError('Please select a resume file.');
    return;
  }

  const formData = new FormData();
  formData.append('resume', file);
    try {
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({
                message: "No file uploaded.",
                success: false
            });
        }

        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

        const userId = req.id;
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            });
        }

        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = file.originalname;

        await user.save();

        return res.status(200).json({
            message: "Resume uploaded successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false
        });
    }
};

