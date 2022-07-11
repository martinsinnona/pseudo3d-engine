const fs = require('fs');
const readline =  require('linebyline');
const iconv = require('iconv-lite');
let id= 0;
(function(){

    search =(name)=>{
        fs.readdir('./obj/',function(err,files){
    
            fs.readdir('./convertJSON/',function(err,files2){
                
            var t = false;
           
            for (let i=0; i < files.length; i++) {

                t = false;
                let g = files[i].substr(0,files[i].length-4);
                
                for(let j = 0;j < files2.length;j++){
                    
                    let f = files2[j].substr(0,files2[j].length-5);

                    if(g != f){
                        t = true;
                    }

                    if(f == g){
                        t = false;
                        break;
                    }
                }

                if(t || files2.length === 0){
                    let temp = './obj/'+files[i];
                    llamarConver(temp);
                } 
   
            }
    
        })});
    }

    llamarConver =(temp)=>{
        console.log('hola')
            create(temp,function(e){
                
                    if(e == "ok"){
                        //let name = models[i].substr(6);
                        //model[i].push({name});
                        console.log('Holis')
                    }
            })
                
    }
    create =(name,callback)=>{
        
            var rl = readline(name,{retainBuffer:true});
            var data = [];
            var name
            rl.on('line',(file,linecount,byteCount)=>{
        
                var line = iconv.decode(file, 'win1251');
                data.push(line);
        
            }).on('error',(e)=>{
        
                console.log(e);
        
            }).on('end',()=>{
        
                var model = {
        
                    "polys":[]
                };
        
                /*******************/
        
                var vertices = [];
        
                for(var i = 0;i < data.length;i++){
        
                    if(data[i].substr(0,1) == "v"){
        
                        var vs = data[i].match(/-?\d+\.?\d*/g); //get data from vertex´s (x,y,z)
        
                        vertices.push(vs[0]);
                        vertices.push(vs[1]);
                        vertices.push(vs[2]);
                    }
                }
        
                for(var i = 0;i < data.length;i++){
        
                    if(data[i].substr(0,6) == "usemtl"){ //use of materials
        
                        var mat = data[i].match(/(?<=usemtl )\S+/g);
        
                        console.log(mat);
        
                    }else if(data[i].substr(0,1) == "f"){
        
                        var ps = data[i].match(/\d+/g); //get data from polys (a,b,c)
        
                        var a = (ps[0] - 1) * 3;
                        var b = (ps[1] - 1) * 3;
                        var c = (ps[2] - 1) * 3;
        
                        var ax = vertices[a];
                        var ay = vertices[a + 1];
                        var az = vertices[a + 2];
        
                        var bx = vertices[b];
                        var by = vertices[b + 1];
                        var bz = vertices[b + 2];
        
                        var cx = vertices[c];
                        var cy = vertices[c + 1];
                        var cz = vertices[c + 2];
        
                        //add new triangle
        
                        model.polys.push({
        
                            "vertices":{
        
                                "a":{"x":ax,"y":ay,"z":az},
                                "b":{"x":bx,"y":by,"z":bz},
                                "c":{"x":cx,"y":cy,"z":cz}
                            },
                            "color":123,
                            id

                        });
                    }
                }
                id++;
                let name2 = name.substr(6);
                let name3 = name2.substr(0,name2.length-4);

                fs.writeFile('./convertJSON/'+name3+'.json',JSON.stringify(model), function(err) {

                    if(err) throw err;
                    callback("ok") 
                });
                
            });
    }

})();

