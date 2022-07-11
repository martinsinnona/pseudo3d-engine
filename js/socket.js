var socket = io.connect({'forceNew':true});

function loadModel(name){
    socket.emit('getModel',name,function(data,len){
        if(data && len == JSON_TEST.polys.length){

            console.log("objeto descargado con exito!");
            mesh_test = new Mesh(JSON_TEST,500,-100,500,5);
        }
    });
}

socket.on('recive',function(data,len){
    JSON_TEST.polys.push(data);
})