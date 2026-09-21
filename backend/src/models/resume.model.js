import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true,
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
    }

    },
    { timestamps: true }
);


const resume = mongoose.models.resume || mongoose.model('resume', resumeSchema);
export default resume;