// content of index.js
const http = require('http');
const fs = require('fs');
const port = 3000

const requestHandler = (request, response) => {
    var url = request.url == "/" ? "./index.html" : "." + request.url;
    console.log(url);
    //response.writeHeader(200, { "Content-Type": "text/html" });
    response.writeHeader(200, {})
    var content = fs.readFileSync(url);
    response.write(content);
    response.end();  
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
})