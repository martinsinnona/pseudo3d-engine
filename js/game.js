
(function() { //PARA PROTEGER   <<<<<------------------------------------------

var canvas = document.getElementById("canvas")

document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);
document.addEventListener("mousemove",mousemove);

var WIDTH  = canvas.width;
var HEIGHT = canvas.height;

var ctx = canvas.getContext('2d',{alpha: false});

var imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
var buf = new ArrayBuffer(imageData.data.length);

var buf8 = new Uint8ClampedArray(buf);
var data = new Uint32Array(buf);
var old_data = new Uint32Array(buf);
var zbuffer = new Float32Array(WIDTH * HEIGHT);

var OFFY = 0;
var OFFSCALE = 0;

var SCROLLX = 0;
var SCROLLY = 0;
var SCROLLZ = 0;

var YSIN = 0;

var FORWARD = false;
var BACKWARD = false;
var RIGHT = false;
var LEFT = false;

var UP = false;
var DOWN = false;

var NEARCLIP = -280;
var FARCLIP = 10000;

var RENDER_MODE = 1;//0 = WIREFRAME,1 = RASTERIZER,2 = BOTH,3 = SCANLINE PROGRESSIVE
var RENDER_POINTS = false;
var PLOT = true; //plot color or zbuffer
var BACKFACE_CULLING = true;0

var POLYCOUNT = 0;
var PIXELCOUNT = 0;

var AMBIENT_LIGHT = 190;

var SIN = 0;
var COS = 0;

var time = 0;

var TIME_0 = 0;
var TIME_1 = 0;
var DELTA_TIME = 0;
var DELTA_COUNT = 0;

var date = null;

var JSON_TEST = {
	"polys":[]
};

/******************************/

var MAX = 0;
var MAXCOUNT = 0;
var INDEXPOLY = 1;

var AX = 0;
var BX = 0;
var AZ = 0;
var BZ = 0;
var ZS = [];

/***********************************************************/

var Point = function(x,y,z){

	this.x = x;
	this.y = y;
	this.z = z;

    this.xpos = x;
    this.ypos = y; //absolute positions!
    this.zpos = z;

	this.scale = 0;

	this.xx = 0;
	this.yy = 0;
	this.ww = 0;

	this.tick = function(){

		this.scale = (300 + OFFSCALE) / ((300 + OFFSCALE) + this.z);

		this.xx = (WIDTH / 2 + (this.x) * this.scale);
		this.yy = (HEIGHT / 2 + (this.y) * this.scale) - OFFY;

		this.ww = 2 * this.scale;
	}

    this.rotate = function(angle,x0,z0){

        this.x = this.xpos + SCROLLX;
        this.y = this.ypos + SCROLLY + YSIN;
        this.z = this.zpos + SCROLLZ;

        var cos = COS;
        var sin = SIN;

        var newx = (this.x-x0) * cos - (this.z-z0) * sin + x0;
        var newz = (this.x-x0) * sin + (this.z-z0) * cos + z0;

        this.x = newx;
        this.z = newz;
    }

	this.render = function(){

		this.tick();

		if(RENDER_POINTS){

    		this.wf = this.ww;

    		if(this.wf > WIDTH){
    			this.wf = WIDTH;
    		}

    		if(this.xx >= 0 && this.xx < WIDTH && this.yy >= 0 && this.yy < WIDTH){

	    		for(var i = 0;i < this.wf;i++){
	    			for(var j = 0;j < this.wf;j++){

	    				plot(this.xx + i,this.yy + j,255 - this.z,0,0,255);
	    			}
	    		}
    		}
		}
	}
}

var Line = function(a,b){

	this.name = "";

	this.a = a;
	this.b = b;

	this.A = a;
	this.B = b;

	this.state = 0;//0 = normal,1 = cutted,2 = invisible

	this.check = function(name){

		this.name = name; 

		if(this.state != 2){this.render(this.A.xx,this.A.yy,this.B.xx,this.B.yy);}

		if(this.a.z < NEARCLIP){

			if(this.b.z < NEARCLIP){

				if(this.name != "L4"){this.state = 2;}

			}else {

				this.A = this.b;
				this.findB();

				this.state = 1;
			}

		}else {

			if(this.b.z < NEARCLIP){

				this.A = this.a;
				this.findB();

				this.state = 1;

			}else {

				if(this.b.z > FARCLIP && this.a.z > FARCLIP){

					this.state = 2;
    				
				}else {

					this.A = this.a;
    				this.B = this.b;

    				this.state = 0;
				}
			}
		}
	}


	this.render = function(x,y,x2,y2) {

        if(RENDER_MODE == 0 || RENDER_MODE == 2){

           	var w = x2 - x ;
           	var h = y2 - y ;

            var dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0 ;

            if (w<0) dx1 = -1 ; else if (w>0) dx1 = 1 ;
            if (h<0) dy1 = -1 ; else if (h>0) dy1 = 1 ;
            if (w<0) dx2 = -1 ; else if (w>0) dx2 = 1 ;

            var longest = Math.abs(w) ;
            var shortest = Math.abs(h) ;

            if (!(longest>shortest)) {

                longest = Math.abs(h) ;
                shortest = Math.abs(w) ;

                if (h<0) dy2 = -1 ; else if (h>0) dy2 = 1 ;
                dx2 = 0 ;            
            }

            var numerator = longest >> 1 ;

            for (var i=0;i<=longest;i++) {

                plot(x,y,0,0,0,0);

                numerator += shortest ;

                if (!(numerator<longest)) {

                    numerator -= longest ;

                    x += dx1 ;
                    y += dy1 ;

                } else {
                    x += dx2 ;
                    y += dy2 ;
                }
            }
        }
    }

	this.findB = function(){

		var PX = null;
    	var PY = null;
    	var PZ = NEARCLIP;

    	/*******************************/

    	var dx = a.x - b.x;
    	var dz = a.z - b.z;

    	var mx = dz / dx;

    	var aa = a;

    	if(a.z < b.z){
    		aa = a;
    	}else{
    		aa = b;
    	}

    	PX = aa.x + (PZ - aa.z) / mx;

    	/*******************************/

    	var dy = a.y - b.y;

    	var my = dy / dz;

    	var aa2 = a;

    	if(a.y < b.y){
    		aa2 = a;
    	}else {
    		aa2 = b;
    	}

    	PY = aa2.y + my * (PZ - aa2.z);

    	this.B = new Point(PX,PY,PZ);
	}

	this.getMinY = function(){

		if(this.state != 2){
			return Math.min(this.A.yy,this.B.yy);
		}else{
			return 9999;
		}
	}

	this.getMaxY = function(){

		if(this.state != 2){
			return Math.max(this.A.yy,this.B.yy);
		}else {
			return -9999;
		}
	}

	this.isVisible = function(){

		if(this.state != 2){

			if((this.A.xx > 0 && this.A.xx < WIDTH)||(this.B.xx > 0 && this.B.xx < WIDTH)){

				return true;
			}
		}
	}
}

var Poly = function(a,b,c){

	this.a = new Point(a.x,a.y,a.z,a.u,a.v);
	this.b = new Point(b.x,b.y,b.z,b.u,b.v);
	this.c = new Point(c.x,c.y,c.z,c.u,c.v);

    this.normal = getNormal(this.a,this.b,this.c);

	this.l1 = new Line(this.a,this.b);
	this.l2 = new Line(this.b,this.c);
	this.l3 = new Line(this.c,this.a);

	this.l4 = null;

	this.red = Math.abs(this.normal.x) * 150 + 20 + Math.random() * 20;
	this.green = Math.abs(this.normal.y) * 150 + 20 + Math.random() * 20;
	this.blue = Math.abs(this.normal.z) * 150 + 20 + Math.random() * 20;
    
    this.rotate = function(angle,x0,z0){

        this.a.rotate(angle,x0,z0);
        this.b.rotate(angle,x0,z0);
        this.c.rotate(angle,x0,z0);
    }

    this.isVisible = function(){

        var ret = true;

        if((this.a.xx > WIDTH && this.b.xx > WIDTH && this.c.xx > WIDTH) || (this.a.xx < 0 && this.b.xx < 0 && this.c.xx < 0)){
            ret = false;
        }

        return ret;
    }

	this.tick = function(){

		this.l1.check("L1");
		this.l2.check("L2");
		this.l3.check("L3");

		if(this.l4 != null){
			this.l4.check("L4");
		}

		if(this.l1.state == 1 && this.l2.state == 1){

			if(this.l4 == null){this.l4 = new Line(this.l1.B,this.l2.B)};

			this.l4.A = this.l1.B;
			this.l4.B = this.l2.B;

		}else if(this.l1.state == 1 && this.l3.state == 1){

			if(this.l4 == null){this.l4 = new Line(this.l1.B,this.l3.B)};

			this.l4.A = this.l1.B;
			this.l4.B = this.l3.B;

		}else if(this.l3.state == 1 && this.l2.state == 1){

			if(this.l4 == null){this.l4 = new Line(this.l3.B,this.l2.B)};

			this.l4.A = this.l3.B;
			this.l4.B = this.l2.B;

		}else {
			this.l4 = null;
		}

		

		this.l1.A.render(true);this.l2.A.render(true);this.l3.A.render(true);
		this.l1.B.render(true);this.l2.B.render(true);this.l3.B.render(true);

		if(this.l4 != null){
			this.l4.A.render(true);
			this.l4.B.render(true);
			this.l4.render(this.l4.A.xx,this.l4.A.yy,this.l4.B.xx,this.l4.B.yy);
		}
	}

	this.getMinY = function(){
		return Math.min(this.l1.getMinY(),this.l2.getMinY(),this.l3.getMinY());
	}

	this.getMaxY = function(){
		return Math.max(this.l1.getMaxY(),this.l2.getMaxY(),this.l3.getMaxY());
	}

	this.render = function(r,g,b,camera){

        var v = new Point(this.a.xpos - camera.xpos,this.a.ypos - camera.ypos,this.a.zpos - camera.zpos);

        if(!BACKFACE_CULLING || (BACKFACE_CULLING && dotProduct(this.normal,v) > 0)){

            this.a.render();
            this.b.render();
            this.c.render();

            if(this.isVisible()){

                this.tick();
                
                var flatz = false;

        		if(this.l1.state != 2 || this.l2.state != 2 || this.l3.state != 2){

                    POLYCOUNT++;

		    		var lines = [this.l1,this.l2,this.l3];

				    if(this.l4 != null){lines.push(this.l4);}

				    if(this.a.z == this.b.z && this.b.z == this.c.z){
				    	flatz = true;
				    }

				    var points = [];
				    var pointsz = [];

				    var min = Math.round(this.getMinY());
					var max = Math.round(this.getMaxY());

					if(max > HEIGHT){max = HEIGHT;}
					if(min < 0){min = 0;}

				    for(var py = min;py <= max;py++){

                        if(py > MAX && RENDER_MODE == 3){break;}

					    for(var i = 0;i < lines.length;i++){

					    	if(lines[i].state != 2){

			    				var aa = null;
			    				var bb = null;

			    				var aay = null;
			    				var bby = null;

			    				var aaz = lines[i].A;
			    				var bbz = lines[i].B;

			    				if(lines[i].A.yy < lines[i].B.yy){
			    					aay = lines[i].A;
			    					bby = lines[i].B;
			    				}else{
			    					aay = lines[i].B;
			    					bby = lines[i].A;
			    				}

			    				if(lines[i].A.xx < lines[i].B.xx){
			    					aa = lines[i].A;
			    					bb = lines[i].B;
			    				}else if(lines[i].A.xx > lines[i].B.xx){
			    					aa = lines[i].B;
			    					bb = lines[i].A;
			    				}else {
			    					aa = aay;
			    					bb = bby;
			    				}

			    				if((py >= aa.yy && py <= bb.yy) || (py >= bb.yy && py <= aa.yy)){

                                    var aaz_div = 300 / (300 + aa.z);

				    				var dx = aa.xx - bb.xx;
				    				var dy = aa.yy - bb.yy;
				    				var dz = aaz_div - (300 / (300 + bb.z));

				    				var m = dy / dx;

				    				var mzx = 0;
				    				var mzy = 0;

				    				if(dx != 0){mzx = dz / dx;}
				    				if(dy != 0){mzy = dz / dy;}

				    				if(m != 0 && m != Infinity && m != -Infinity){

					    				var px = (py - aa.yy) / m;
					    				var pz = 0;

					    				if(!flatz){
					    					pz = aaz_div + px * mzx;
					    				}else {
					    					pz = aaz_div;
					    				}

					    				points.push(px + aa.xx);
					    				pointsz.push(pz);

				    				}else if(m == Infinity || m == -Infinity){

				    					var px = aa.xx;
				    					var pz = 0;

					    				if(!flatz){
					    					pz = aaz_div + mzy * (py - aa.yy);
					    				}else {
					    					pz = aaz_div;
					    				}

					    				points.push(px);
					    				pointsz.push(pz);
				    				}
			    				}	
			    			}
					    }

                        if(py == MAX && RENDER_MODE == 3){

                            AX = points[0];
                            BX = points[1];

                            AZ = pointsz[0];
                            BZ = pointsz[1];
                        }

                        // ....detected lines viewer.... 

					    /*for(var i = 0;i < 50;i++){
					    	plot(i,250,0,0,0);
					    }*/

					    /*for(var i = 0;i < points.length;i++){

					    	for(var x = 0;x < 8;x++){
					    		for(var y = 0;y < 8;y++){

					    			plot(points[i]+x,py+y,pointsz[i] * 2,0,pointsz[i] * 2);
					    		}
					    	}
					    }*/

					    /*if(points[0] < 0){points[0] = 0;}else if(points[0] > WIDTH){points[0] = WIDTH;}
						if(points[1] < 0){points[1] = 0;}else if(points[1] > WIDTH){points[1] = WIDTH;}*/

                        var ax = 0;
						var d = 0;

						var z0 = 0;
						var dz = 0;
				    	var mz = 0;

                        var j0 = 0;

                        ax = Math.min(points[0],points[1]);
                        d = Math.abs(points[0] - points[1]);

                        if(ax < 0){
                            j0 = Math.abs(ax);
                        }

                        var d_off = 0;

                        if(ax + d > WIDTH){
                            d_off = (ax + d) - WIDTH;
                        }

                        if(points[0] < points[1]){

                            z0 = pointsz[0];
                            dz = pointsz[1] - pointsz[0];

                        }else{

                            z0 = pointsz[1];
                            dz = pointsz[0] - pointsz[1];
                        }

				    	if(!flatz){
				    		mz = dz / d;
				    	}

						if(ax < WIDTH && ax + d > 0){

							if(RENDER_MODE != 0){

				    			for(var j = j0;j <= d - d_off;j++){

			    					var pz = null;

			    					if(!flatz){
			    						pz = z0 + mz * j;
			    					}else {
			    						pz = (300 / (300 + this.a.z));
			    					}

                                    if(py == MAX && RENDER_MODE == 3){
                                        ZS.push(pz);
                                    }

				    				plot(ax+j,py,pz,this.red,this.green,this.blue);
				    			}
			    			}

			    			/*if(RENDER_MODE == 0 || RENDER_MODE == 2){

				    			plot(points[0],py,0,0,0,0);
				    			plot(points[1],py,0,0,0,0,0);
			    			}*/
						}

					    points = [];
					    pointsz = [];
					}
    			}
            } 
        }
		}
}

var Cube = function(x,y,z){

	this.x = x;
	this.y = y;
	this.z = z;

	this.r = Math.random() * 255;
	this.g = Math.random() * 255;
	this.b = Math.random() * 255;

	this.w = 100;

	this.p1 = new Point(this.x,this.y,this.z);
	this.p2 = new Point(this.x,this.y - 0,this.z + this.w);
	this.p3 = new Point(this.x + this.w,this.y,this.z + this.w);
	this.p4 = new Point(this.x + this.w,this.y,this.z);

	this.p5 = new Point(this.x,this.y + this.w,this.z);
	this.p6 = new Point(this.x,this.y + this.w,this.z + this.w);
	this.p7 = new Point(this.x + this.w,this.y + this.w,this.z + this.w);
	this.p8 = new Point(this.x + this.w,this.y + this.w,this.z);

	this.polys = [];

	this.polys.push(new Poly(this.p1,this.p2,this.p3));
	this.polys.push(new Poly(this.p1,this.p3,this.p4));

	this.polys.push(new Poly(this.p5,this.p6,this.p7));
	this.polys.push(new Poly(this.p5,this.p7,this.p8));

	this.polys.push(new Poly(this.p1,this.p2,this.p5));
	this.polys.push(new Poly(this.p5,this.p6,this.p2));

	this.polys.push(new Poly(this.p8,this.p4,this.p3));
	this.polys.push(new Poly(this.p8,this.p7,this.p3));

	this.polys.push(new Poly(this.p1,this.p4,this.p5));
	this.polys.push(new Poly(this.p5,this.p4,this.p8));

	this.polys.push(new Poly(this.p2,this.p3,this.p7));
	this.polys.push(new Poly(this.p2,this.p6,this.p7));

    this.rotate = function(angle,x0,z0){

        for(var i = 0;i < this.polys.length;i++){
            this.polys[i].rotate(angle,x0,z0);
        }
    }

	this.render = function(camera){

		for(var i = 0;i < this.polys.length;i++){
			this.polys[i].render(this.r,this.g,this.b,camera);
		}
	}
}

var Map = function(w,r,g,b){

	this.w = w+1;

	this.r = r;
	this.g = g;
	this.b = b;

	this.points = [];
	this.polys = [];

	for(var z = 0;z < this.w;z++){
		for(var x = 0;x < this.w;x++){
			this.points.push(new Point(x * 50,Math.sin(z / 10) * z * 2 + Math.cos(x / 10) * x * 3,z * 50));
		}
	}

	var g = 0;

	for(var i = 0;i < this.points.length;i++){

		if(g < this.w - 1){

    		if(this.points[i+this.w+1] != null){

                this.polys.push(new Poly(this.points[i+this.w+1],this.points[i+this.w],this.points[i]));
                this.polys.push(new Poly(this.points[i+1],this.points[i+this.w+1],this.points[i]));
    		}	

    		g++;

		}else {g = 0;}
	}

	this.render = function(camera){

		for(var i = 0;i < this.polys.length;i++){
			this.polys[i].render(this.r,this.g,this.b,camera);
		}
	}

    this.rotate = function(angle,x0,z0){

        for(var i = 0;i < this.polys.length;i++){
            this.polys[i].rotate(angle,x0,z0);
        }
    }
}

var Mesh = function(model,x,y,z,scale){

    this.polys = [];

    for(var i = 0;i < model.polys.length;i++){

        var v1 = model.polys[i].vertices.a;
        var v2 = model.polys[i].vertices.b;
        var v3 = model.polys[i].vertices.c;

        var a = new Point(v1.x * scale,-v1.y * scale,-v1.z * scale);
        var b = new Point(v2.x * scale,-v2.y * scale,-v2.z * scale);
        var c = new Point(v3.x * scale,-v3.y * scale,-v3.z * scale);

        a.x += x;
        a.y += y;
        a.z += z;

        b.x += x;
        b.y += y;
        b.z += z;

        c.x += x;
        c.y += y;
        c.z += z;

        this.polys.push(new Poly(a,b,c));
    }

    this.render = function(camera){

        if(RENDER_MODE == 3){

            if(INDEXPOLY < this.polys.length){

                for(var i = 0;i < INDEXPOLY;i++){
                    this.polys[i].render(150,100,100,camera);
                }
            }

        }else{

            for(var i = 0;i < this.polys.length;i++){
                this.polys[i].render(150,100,100,camera);
            }
        }
    }

    this.rotate = function(angle,x0,z0){

        for(var i = 0;i < this.polys.length;i++){
            this.polys[i].rotate(angle,x0,z0);
        }
    }
}

var Camera = function(x,y,z){

    this.xpos = x;
    this.ypos = y;
    this.zpos = z;

    this.vel = 0;

    this.angle = 0;

    this.rot_timer = 0;
    this.rot_vel = 0;

    this.vector = new Point(0,0,0);

    this.tick = function(){

        this.rot_timer++;

        if(this.angle > 360){
            this.angle -= 360;
        }else if(this.angle < -360){
            this.angle += 360;
        }

        this.vector.x = Math.sin(getRad(this.angle));
        this.vector.z = Math.cos(getRad(this.angle));
    }
}

/*************************************************************************/

var camera = new Camera(0,0,-300);

var map = new Map(50,150,0,0);

var poly = new Poly(new Point(0,0,0),new Point(100,0,0),new Point(0,-100,0));
var poly2 = new Poly(new Point(100,0,0),new Point(100,-100,0),new Point(0,-100,0));

var cube = new Cube(0,-200,500,1);

var humans = [];

for(var x = 0;x < 1;x++){
    for(var z = 0;z < 1;z++){
        humans.push(new Mesh(json_house,-100,0,0,90));
    }
}

var mesh_test = null;

//loadModel("groot");

/*************************************************************************/

tick();

function tick(){

    date = new Date();
    TIME_0 = date.getTime();

    MAX += MAXCOUNT;

    if(MAX <= 0){MAX = 0;}
    if(MAX > HEIGHT){MAX = 0;INDEXPOLY++;}

    if(RENDER_MODE != 3){
	   for(var i = 0;i < data.length;i++){data[i] = -3618616;}
	   for(var i = 0;i < zbuffer.length;i++){zbuffer[i] = -9000;}
    }

    camera.tick();

    if(FORWARD || BACKWARD || RIGHT || LEFT || DOWN || UP){

        time++;

        if(camera.vel < 14){camera.vel++;}
        YSIN = Math.sin(time / 3) * 6;

    }else{
        camera.vel = 0;
    }

    if(FORWARD){ 

        camera.xpos += camera.vel * Math.sin(getRad(camera.angle));
        camera.zpos += camera.vel * Math.cos(getRad(camera.angle));
    }

    if(BACKWARD){

        camera.xpos += camera.vel * Math.sin(getRad(camera.angle + 180));
        camera.zpos += camera.vel * Math.cos(getRad(camera.angle + 180));
    }

    if(RIGHT){

        camera.xpos += camera.vel * Math.sin(getRad(camera.angle + 90));
        camera.zpos += camera.vel * Math.cos(getRad(camera.angle + 90));
    }

    if(LEFT){

        camera.xpos += camera.vel * Math.sin(getRad(camera.angle - 90));
        camera.zpos += camera.vel * Math.cos(getRad(camera.angle - 90));
    }

    if(UP){camera.ypos -= camera.vel;}else if(DOWN){camera.ypos += camera.vel;}

    SCROLLX = -camera.xpos;
    SCROLLY = -camera.ypos;
    SCROLLZ = -camera.zpos - 300;

    if(camera.rot_timer < 5) {
        camera.angle += camera.rot_vel;
    }

    SIN = Math.sin(getRad(camera.angle));
    COS = Math.cos(getRad(camera.angle));

    map.rotate(camera.angle,0,-300);
    cube.rotate(camera.angle,0,-300);

    for(var i = 0;i < humans.length;i++){
        humans[i].rotate(camera.angle,0,-300);
    }

    poly.rotate(camera.angle,0,-300);
    poly2.rotate(camera.angle,0,-300);

    /**************************************************/

    map.render(camera);

    /*for(var i = 0;i < humans.length;i++){
        humans[i].render(camera);
	}*/
	
	if(mesh_test != null){
		mesh_test.rotate(camera.angle,0,-300);
		mesh_test.render(camera);
	}

    //cube.render(camera);

    //poly.render(100,0,0,camera);
    //poly2.render(0,100,0,camera);

    /***************************************/

    plot(200,112,1000,0,0,0);

	imageData.data.set(buf8);
	ctx.putImageData(imageData, 0, 0);

    ctx.font = "12px Arial";

    ctx.fillText("⃤  " + POLYCOUNT,10,15);

    POLYCOUNT = 0;
    PIXELCOUNT = 0;

    //drawScanline();

    date = new Date();
    TIME_1 = date.getTime();

    DELTA_COUNT++;

    if(DELTA_COUNT > 30){
        DELTA_TIME = TIME_1 - TIME_0;
        DELTA_COUNT = 0;
    }

    ctx.fillText(DELTA_TIME+" ms",60,15);

    window.requestAnimationFrame(tick);
}

function getXY(x,y){
	return (y * WIDTH + x) * 4;
}

function drawLine(x,y,x2,y2) {

    var w = x2 - x;
    var h = y2 - y;

    var dx1 = 0;
    var dy1 = 0;
    var dx2 = 0;
    var dy2 = 0;

    if (w<0) dx1 = -1 ; else if (w>0) dx1 = 1 ;
    if (h<0) dy1 = -1 ; else if (h>0) dy1 = 1 ;
    if (w<0) dx2 = -1 ; else if (w>0) dx2 = 1 ;

    var longest = Math.abs(w) ;
    var shortest = Math.abs(h) ;

    if (!(longest>shortest)) {

        longest = Math.abs(h) ;
        shortest = Math.abs(w) ;

        if (h<0) dy2 = -1 ; else if (h>0) dy2 = 1 ;
        dx2 = 0 ;            
    }

    var numerator = longest >> 1 ;

    for (var i=0;i<=longest;i++) {

        plot(x,y,0,0,0,0);

        numerator += shortest ;

        if (!(numerator < longest)) {

            numerator -= longest ;

            x += dx1 ;
            y += dy1 ;

        } else {
            x += dx2 ;
            y += dy2 ;
        }
    }
}

function drawScanline(){

    if(RENDER_MODE == 3){

        ctx.beginPath();

        ctx.moveTo(0, MAX+1);
        ctx.lineTo(WIDTH, MAX+1);
        ctx.stroke();

        ctx.fillText(Math.round(AZ * 1000) / 1000,370,MAX);
        ctx.fillText(Math.round(BZ * 1000) / 1000,10,MAX);

        ctx.font = "8px Arial";

        for(var i = 0;i < 22;i++){

            if(ZS[i] != undefined){
                ctx.fillText(Math.round(ZS[i] * 100) / 100,38 * i,200);
            }
        }

        for(var i = 22;i < ZS.length;i++){

            if(ZS[i] != undefined){
                ctx.fillText(Math.round(ZS[i]*100)/100,38 * (i-22),220);
            }
        }

        ZS = [];
    }
}

function plot(x,y,z,r,g,b){

	var xx = Math.round(x);
	var yy = Math.round(y);
	var zz = z;

    PIXELCOUNT++;

	if(xx >= 0 && xx < WIDTH && yy >= 0 && yy < HEIGHT){

		var zb = zbuffer[yy * WIDTH + xx];

		if(zz > zb || zb == -9000){

    		if(r > 255){r = 255;}else if(r < 0){r = 0;}
    		if(g > 255){g = 255;}else if(g < 0){g = 0;}
    		if(b > 255){b = 255;}else if(b < 0){b = 0;}

            var light = Math.abs(zz) * 100;

            var aux = (255 - AMBIENT_LIGHT) - light;

            var red = r - aux;
            var green = g - aux;
            var blue = b - aux;

            if(red < 0){red = 0;}
            if(green < 0){green = 0;}
            if(blue < 0){blue = 0;}

            if(red > r){red = r;}
            if(green > g){green = g;}
            if(blue > b){blue = b;}
            
	    	if(PLOT){
                data[yy * WIDTH + xx] = (255 << 24) | (blue << 16) | (green <<  8) | red;
            }else{
                data[yy * WIDTH + xx] = (255 << 24) | (0 << 16) | (0 <<  8) | (light);
            }

	    	zbuffer[yy * WIDTH + xx] = zz;	
    	}	
	}
}

function getColor(r,g,b){
    return (255 << 24) | (b << 16) | (g <<  8) | r;
}

function getRad(angle){
    return angle * (Math.PI / 180);
}

function getNormal(a,b,c){

    var ax = c.x - a.x;
    var ay = c.y - a.y;
    var az = c.z - a.z;

    var bx = b.x - a.x;
    var by = b.y - a.y;
    var bz = b.z - a.z;

    var cx = ay * bz - az * by;
    var cy = az * bx - ax * bz;
    var cz = ax * by - ay * bx;

    var length = Math.sqrt(cx*cx + cy*cy + cz*cz);

    return new Point((cx / length),(cy / length),(cz / length));
}

function dotProduct(v1,v2){

    return (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);
}

function keydown(event){
	
    if(event.keyCode == 87){
		FORWARD = true;
        BACKWARD = false;
	}

    if(event.keyCode == 83){
		BACKWARD = true;
        FORWARD = false;
	}

    if(event.keyCode == 65){
		LEFT = true;
        RIGHT = false;
	}

    if(event.keyCode == 68){
		RIGHT = true;
        LEFT = false;
	}

	if(event.keyCode == 32){
		UP = true;
        DOWN = false;
	}

    if(event.keyCode == 16){
		DOWN = true;
        UP = false;
	}

    if(event.keyCode == 38){MAXCOUNT = -1;}else if(event.keyCode == 40){MAXCOUNT = 1;}
}

function keyup(event){

	if(event.keyCode == 87){
        FORWARD = false;
        BACKWARD = false;
	}

    if(event.keyCode == 83){
        BACKWARD = false;
        FORWARD = false;
	}

	if(event.keyCode == 65){
        LEFT = false;
        RIGHT = false;
	}

    if(event.keyCode == 68){
        RIGHT = false;
        LEFT = false;
	}

	if(event.keyCode == 32){
		UP = false;
        DOWN = false;
	}

    if(event.keyCode == 16){
		DOWN = false;
        UP = false;
	}

    if(event.keyCode == 82){
        PLOT = !PLOT;
    }

    if(event.keyCode == 38){MAXCOUNT = 0;}else if(event.keyCode == 40){MAXCOUNT = 0;}

    if(event.keyCode == 66){
        BACKFACE_CULLING = !BACKFACE_CULLING;
        console.log("BACKFACE_CULLING : "+BACKFACE_CULLING);
    }

    if(event.keyCode == 13){

        if(RENDER_MODE == 1){

            RENDER_MODE = 3;

            for(var i = 0;i < data.length;i++){data[i] = -3618616;}
            for(var i = 0;i < zbuffer.length;i++){zbuffer[i] = -9000;}

            MAX = 0;

        }else{RENDER_MODE = 1;MAX = 0;}
    }
}

function mousemove(event){

    camera.rot_timer = 0;
    camera.rot_vel = event.movementX / 10;

    OFFY += event.movementY / 4;
}

function fullscreen(){

    canvas.webkitRequestFullscreen();

    canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
}

//})();