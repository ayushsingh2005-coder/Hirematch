// start a server
// connect with mongoDB 

import app from "./src/app.js";
import connecttoDB from "./src/config/database.js";

app.get('/', (req, res) => {
  res.send('Hello, server is working!');
});

app.listen(3000 , ()=>{
    console.log("server is listening on port 3000");
    
})