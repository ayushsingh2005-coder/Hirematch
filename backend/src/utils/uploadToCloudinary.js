import cloudinary from "../config/cloudinary.js"

export function uploadToCloudinary (id){
    return new Promise((resolve , reject) =>{
        const stream  = cloudinary.uploader.upload_stream(
            {
                folder : 'hirematch/resumes',
                resource_type : 'raw',
                public_id : `resume_${id}`,
            },
            (error , result) =>{
                if(error) reject(error);
                else resolve(result);
            }
        );
        stream.end(file.buffer);
    });
};

