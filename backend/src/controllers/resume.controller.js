// req.file aayega Multer se (Cloudinary pe already upload ho chuka hoga)
//       ↓
// pdf-parse se rawText extract karenge (req.file.path se)
//       ↓
// findOneAndUpdate se MongoDB mein save karenge (upsert)
//       ↓
// Response bhejenge


import cloudinary from "../config/cloudinary.js";
import upload from "../config/multer.js";
import { PDFParse } from 'pdf-parse';
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import resume from "../models/resume.model.js";

export async function uploadResume(req,res){
    try {

         console.log("🔥 CONTROLLER REACHED");

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
        
        const file = req.file;

        if(!file){
            res.status(400).json({
                success : false,
                message : "File is required",
                error : "File is required"
            })
        }

        const previousResume = await resume.find({userId : req.user._id});

        if(previousResume){
            const previousResumeUrl = previousResume.fileUrl;
            const public_id = `resume_${req.user._id}`;
            await cloudinary.uploader.destroy(public_id);
        }

        // extracting raw text from pdf file (raw) 
        const pdfData = await  PDFParse(file.buffer);
        const  rawText = pdfData.text;
    
        //uploading file to cloudinary 
        const cloudinaryResult = await uploadToCloudinary(req.user._id);
        const fileUrl = cloudinaryResult.secure_url;

        const documentResume = await resume.findOneAndUpdate(
        { userId: req.user._id },
    {
        userId: req.user._id,
        fileUrl: fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        rawText: rawText,
    },
        { upsert: true, new: true }
        );

        // Resume (jo ki updated hai iska use karke iska analysis karyenge frontend pe for user )

        return res.status(200).json({
            success : true,
            updatedResume : documentResume,
            message : "Ready for AI analysis"
        })
        

    } catch (error) {
        res.status(500).json({
            success : false,
            message : "Internal server Error",
            error : error
        })
}}