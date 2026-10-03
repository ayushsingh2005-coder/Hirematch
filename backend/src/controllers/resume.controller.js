import Resume from "../models/resume.model.js";
import cloudinary from "../config/cloudinary.js";
import { PDFParse } from "pdf-parse";

const uploadToCloudinary = (buffer, userId) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "hirematch/resumes",
                resource_type: "raw",
                public_id: `resume_${userId}.pdf`,
                overwrite: true,
                invalidate: true,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
};

export async function resumeUpload(req, res) {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF file up to 5MB",
            });
        }

        // extract text from PDF
        const parser = new PDFParse({ data: file.buffer });
        let rawText;

        try {
            const pdfData = await parser.getText();
            rawText = pdfData.text;
        } finally {
            await parser.destroy();
        }

        if (!rawText || rawText.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Could not extract text from PDF. Please upload a valid resume.",
            });
        }

        // upload to cloudinary (same public_id overwrites the old resume)
        const cloudinaryResult = await uploadToCloudinary(file.buffer, req.user._id);

        // save to MongoDB
        const resume = await Resume.findOneAndUpdate(
            { userId: req.user._id },
            {
                userId: req.user._id,
                fileUrl: cloudinaryResult.secure_url,
                publicId: cloudinaryResult.public_id,
                fileName: file.originalname,
                fileSize: file.size,
                rawText,
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Resume uploaded successfully",
            resume: {
                fileUrl: resume.fileUrl,
                fileName: resume.fileName,
                fileSize: resume.fileSize,
                uploadedAt: resume.updatedAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Resume upload failed",
            error: error.message,
        });
    }
}