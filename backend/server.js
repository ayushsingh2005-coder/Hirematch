// start a server
// connect with mongoDB 

import app from "./src/app.js";
import dns from "node:dns";
import connecttoDB from "./src/config/database.js";
const PORT = process.env.PORT || 3000;

dns.setServers(["8.8.8.8", "1.1.1.1"]);

connecttoDB();

app.get('/', (req, res) => {
  res.send('Hello, server is working!');
});

app.listen(PORT, ()=>{
    console.log(`server is running on http://localhost:${PORT}`);
    
})