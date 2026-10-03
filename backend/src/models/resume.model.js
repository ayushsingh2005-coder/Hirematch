import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true,
        unique : true
    },
    fileUrl : {
        type: String,
        required: true,
    },
    fileName : {
        type: String,
        required: true,
    },
    fileSize : {
        type: Number,
    },
    rawText : {
        type : String,
        required : true
    },
    publicId: {
    type: String,
    required: true  // Cloudinary public_id — delete ke liye zaroori
    }
},
    { timestamps: true }
);


const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
export default Resume;