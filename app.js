const express = require("express");
const axios = require("axios");
const redis = require("redis");
const util = require('util')
const app = express();

const redisUrl = 'redis://127.0.0.1:6379'
const client = redis.createClient(redisUrl);

//log error to the console if any occurs
client.on("error", (err) => {
    console.log(err);
});

app.get("/jobs?:id", async (req, res) => {
    const searchTerm = req.query.search;
    try {
        client.get = util.promisify(client.get)
        client.setex = util.promisify(client.setex)
        const cachedData = await client.get(searchTerm)
        if(cachedData){
            return res.status(200).json({message:"Data retrieved from the cache", success: true, response: JSON.parse(cachedData)})
        }
        const jobs = await axios.get(`https://jsonplaceholder.typicode.com/posts/${searchTerm}`);
        await client.setex(searchTerm, 600, JSON.stringify(jobs.data))
        return res.status(200).json({message:"Data retrieved from the Db", success: true, response: jobs.data})
    } catch(err) {
        return res.status(500).json({message:"Internal Server Error", success: false, error: err.message})
    }
});


app.listen(process.env.PORT || 3000, () => {
    console.log("Node server started");
});