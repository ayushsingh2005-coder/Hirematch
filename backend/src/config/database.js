import mongoose from "mongoose";
import config from "./config.js";

async  function connecttoDB() {
    await mongoose.connect(config.MONGODB_URI)

    console.log("Connected to DB");
    
}
export default connecttoDB;