// start a server
// connect with mongoDB 

import app from "./src/app.js";
import dns from "node:dns";
import connecttoDB from "./src/config/database.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

connecttoDB();

app.get('/', (req, res) => {
  res.send('Hello, server is working!');
});

app.listen(3000 , ()=>{
    console.log("server is listening on port 3000");
    
})