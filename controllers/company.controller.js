import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";



export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;

        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false,
            });
        }

        let company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register the same company again.",
                success: false,
            });
        }

        company = await Company.create({
            name: companyName,
            userId: req.id,
        });

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true,
        });
    } catch (error) {
        console.error("Register company error:", error.message || error);
        return res.status(500).json({
            message: "An error occurred while registering the company.",
            error: error.message || "Unknown error",
            success: false,
        });
    }
};


export const getCompany = async (req, res) => {
    try {
        const userId = req.id; 
        const companies = await Company.find({ userId });

        if (!companies || companies.length === 0) {
            return res.status(404).json({
                message: "No companies found for this user.",
                success: false,
            });
        }

        return res.status(200).json({
            companies,
            success: true,
        });
    } catch (error) {
        console.error("Get company error:", error.message || error);
        return res.status(500).json({
            message: "An error occurred while retrieving companies.",
            error: error.message || "Unknown error",
            success: false,
        });
    }
};

export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false,
            });
        }

        return res.status(200).json({
            company,
            success: true,
        });
    } catch (error) {
        console.error("Get company by ID error:", error.message || error);
        return res.status(500).json({
            message: "An error occurred while retrieving the company.",
            error: error.message || "Unknown error",
            success: false,
        });
    }
};

export const getAllCompanies = catchAsyncErrors(async (req, res, next) => {
    const companies = await Company.find(); 
    if (!companies || companies.length === 0) {
        return next(new ErrorHandler("No companies found", 404)); 
    }
  
    res.status(200).json({
        success: true,
        companies,  // Changed from 'users' to 'companies'
    });
});



export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
        const file = req.file;

        let logo;
        if (file) {
            try {
                
                const fileUri = getDataUri(file);
                if (!fileUri || !fileUri.content) {
                    return res.status(400).json({
                        message: "Invalid file data.",
                        success: false,
                    });
                }

              
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
                logo = cloudResponse.secure_url;
            } catch (err) {
                console.error("Cloudinary upload error:", err.message || err);
                return res.status(500).json({
                    message: "File upload failed. Please check your file and try again.",
                    error: err.message || "Unknown error",
                    success: false,
                });
            }
        }

        const updateData = { name, description, website, location };
        if (logo) updateData.logo = logo;

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
        }).maxTimeMS(5000); 

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Company information updated successfully.",
            company,
            success: true,
        });
    } catch (error) {
        console.error("Update company error:", error.message || error);
        return res.status(500).json({
            message: "An error occurred while updating the company.",
            error: error.message || "Unknown error",
            success: false,
        });
    }
};
