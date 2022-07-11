const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
var clog = console.log;
const fs = require('fs');
app.use(express.static(__dirname+'/public'));
require('./functions/createJSON');
search();

io.on('connect',(socket)=>{
    let id =0;
    socket.on('getModel',(name,fn)=>{
        fs.readFile('./convertJSON/'+name+'.json',(err,data)=>{
            var obj= JSON.parse(data);
            for(let i = 0; i<obj.polys.length;i++){
                let temp=obj.polys[i];
                temp.id=id;
                socket.emit('recive',temp);
            }
            fn(true,obj.polys.length);
            id++
        });
    })
});

server.listen(8080,function(){
    clog('Servidor corriendo en 8080')
})


