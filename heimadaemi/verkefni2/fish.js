/////////////////////////////////////////////////////////////////
//    Fish draft
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];
var locColor;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var vBuffer;
var vPosition;
var fBuffer;
var matrixLoc;

var rotTail = [0.0, 0.0, 0.0];        // Snuningshorn spords
var incTail = [1.1, 2.0, 2.3];        // Breyting a snuningshorni

var fishLoc = [
    /*vec3(0.3, 0.3, 0.3),
    vec3(0.1, 0.1, 0.1),
    vec3(-0.3, 0.4, 0.7),
	vec3(-0.7, 0.2, -0.5),
	vec3(-0.5, 0.8, 0.1),
	vec3(0.2, -0.4, -0.2),*/
	//vec3(-0.7, 0.1, 0.),
];

var fishVec = [
    /*vec3(0.01, 0.01, 0.01),
    vec3(0.01, 0.0, 0.0),
    vec3(-0.01, 0.0, 0.01),
	vec3(0.4, 0.4, 0.4),
	vec3(0.4, 0.4, 0.4),
	vec3(0.4, 0.4, 0.4),*/
];

var fishCol = [
    /*vec4(0.2, 0.8, 1.0, 1.0),
    vec4(0.2, 0.6, 0.9, 1.0),
    vec4(0.3, 0.7, 0.9, 1.0),
	vec4(0.1, 0.7, 0.9, 1.0),
	vec4(0.2, 0.8, 0.8, 1.0),
	vec4(0.3, 0.6, 0.7, 1.0),*/
];

var aStrength = 0.25;
var cStrength = 0.25;
var sStrength = 0.25;
var pStrength = 0.0;
var fStrength = 0.0;
var rStrength = 0.0;

var minSpeed = 0.0015;
var maxSpeed = 0.003;

var coDistance = 0.7;
var alDistance = 0.7;
var sepDistance = 0.3;
var fishSize = 0.6;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	var numFish = 1;
	for (var i = 0; i < numFish; i++) {
		fishLoc.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
		fishVec.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
		fishCol.push(vec4(Math.random()*0.3, Math.random()*0.5+0.5, Math.random()*0.3+0.7, 1.0));
	}
    
    /*var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
*/
    locColor = gl.getUniformLocation(program, "rColor");
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    fBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fBuffer);
    // This is the fish model
    gl.bufferData(gl.ARRAY_BUFFER, flatten([
        // Body 
        vec3(0,0,0),
        vec3(-0.2, 0.1, 0.0),
        vec3(-0.2, -0.1, 0.0),
        vec3(-0.2, 0.1, 0.0),
        vec3(-0.2, -0.1, 0.0),
        vec3(-0.5, 0, 0),
        // Tail
        vec3(-0.5, 0, 0),
        vec3(-0.6, 0.1, 0),
        vec3(-0.6, -0.1, 0),
        // Fins
        vec3(-0.2, 0.0, 0.0),
        vec3(-0.3, 0.05, 0.1),
        vec3(-0.3, -0.05, 0.1),
        vec3(-0.2, 0.0, 0.0),
        vec3(-0.3, 0.05, -0.1),
        vec3(-0.3, -0.05, -0.1)
        

    ]), gl.STATIC_DRAW);

    matrixLoc = gl.getUniformLocation( program, "rotation" );

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
	
	// Sliders
	document.getElementById("cohesionSlider").onchange = function(event) {
		cStrength = parseFloat(event.target.value);
	};
	document.getElementById("alignmentSlider").onchange = function(event) {
		aStrength = parseFloat(event.target.value);
	};
	document.getElementById("separationSlider").onchange = function(event) {
		sStrength = parseFloat(event.target.value);
	};
	document.getElementById("maintenanceSlider").onchange = function(event) {
		pStrength = parseFloat(event.target.value);
	};
	document.getElementById("forwardSlider").onchange = function(event) {
		fStrength = parseFloat(event.target.value);
	};
	document.getElementById("randomSlider").onchange = function(event) {
		rStrength = parseFloat(event.target.value);
	};
	document.getElementById("minSpeedSlider").onchange = function(event) {
		minSpeed = parseFloat(event.target.value);
	};
	document.getElementById("maxSpeedSlider").onchange = function(event) {
		maxSpeed = parseFloat(event.target.value);
	};
	document.getElementById("cohesionNeighbourhood").onchange = function(event) {
		coDistance = parseFloat(event.target.value);
	};
	document.getElementById("alignmentNeighbourhood").onchange = function(event) {
		alDistance = parseFloat(event.target.value);
	};
	document.getElementById("separationNeighbourhood").onchange = function(event) {
		sepDistance = parseFloat(event.target.value);
	};
	document.getElementById("addFish").onclick = function(){
		fishLoc.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
		fishVec.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
		fishCol.push(vec4(Math.random()*0.3, Math.random()*0.5+0.5, Math.random()*0.3+0.7, 1.0));
	};
	document.getElementById("removeFish").onclick = function(){
		fishLoc.pop();
		fishVec.pop();
		fishCol.pop();
	};
	document.getElementById("fishSize").onchange = function(event) {
		fishSize = parseFloat(event.target.value);
	};
	document.getElementById("reset").onclick = function() {
		fishLoc = [];
		fishVec = [];
		for (var i = 0; i < fishCol.length; i++) {
			// Kinda hacky - preserve the fish colors to know how many fish should exist
			fishLoc.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
			fishVec.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
		}
	}
	
    render();
}

function colorCube()
{
    /*quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );*/
    line(0, 1);
    line(1,2);
    line(2, 3);
    line(3, 0);
    //line(3, 0);
    line(4, 5);
    line(5, 6);
    line(6, 7);
    line(7, 4);
    line(0,4);
    line(1,5);
    line(2,6);
    line(3,7);
    
}

function line(a, b) {
	var size = 1.0;
    var vertices = [
        /*vec3( -0.8, -0.8,  0.8 ),
        vec3( -0.8,  0.8,  0.8 ),
        vec3(  0.8,  0.8,  0.8 ),
        vec3(  0.8, -0.8,  0.8 ),
        vec3( -0.8, -0.8, -0.8 ),
        vec3( -0.8,  0.8, -0.8 ),
        vec3(  0.8,  0.8, -0.8 ),
        vec3(  0.8, -0.8, -0.8 )*/
		vec3( -size, -size,  size ),
        vec3( -size,  size,  size ),
        vec3(  size,  size,  size ),
        vec3(  size, -size,  size ),
        vec3( -size, -size, -size ),
        vec3( -size,  size, -size ),
        vec3(  size,  size, -size ),
        vec3(  size, -size, -size )
    ];
    
    points.push(vertices[a], vertices[b]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    
    
}

function getLocalFlockmates(fishId, neighbourhood) {
    var localFlockmates = [];
	for (var i = 0; i < fishLoc.length; i++) {
		if (i == fishId) {
			continue;
		}
		var dist = subtract(fishLoc[i], fishLoc[fishId]);
		if (dot(dist,dist) <= neighbourhood ** 2) {
			localFlockmates.push(i);
		}
	}
	return localFlockmates;
} 

function getAverageLocalHeading(fishId) {
	var sum = vec3(0, 0, 0);
	var localFlockmates = getLocalFlockmates(fishId, alDistance);
	if (localFlockmates.length == 0) {
		// TODO double check this is correct behaviour?
		//return vec3(0,0,0)
		return fishVec[fishId];
	}
	for (var i = 0; i < localFlockmates.length; i++) {
		var id = localFlockmates[i];
		sum = add(sum, fishVec[id]);
	}
	var scale = 1.0/localFlockmates.length;
	return vec3(sum[0]*scale, sum[1]*scale, sum[2]*scale);
}

function getAverageLocalPosition(fishId) {
	var sum = vec3(0, 0, 0);
	var localFlockmates = getLocalFlockmates(fishId, coDistance);
	if (localFlockmates.length == 0) {
		// TODO double check this is correct behaviour?
		return fishLoc[fishId];
	}
	for (var i = 0; i < localFlockmates.length; i++) {
		var id = localFlockmates[i];
		sum = add(sum, fishLoc[id]);
	}
	var scale = 1.0/localFlockmates.length;
	return vec3(sum[0]*scale, sum[1]*scale, sum[2]*scale);
}

function getSeparation(fishId) {
	var start = vec3(0,0,0);
	var localFlockmates = getLocalFlockmates(fishId, sepDistance);
	for (var i = 0; i < localFlockmates.length; i++) {
		var id = localFlockmates[i];
		// vector away from neighbour
		var v = subtract(fishLoc[fishId],fishLoc[id]);
		start = add( start, v );
	}
	return start;
}

function getCohesion(fishId) {
	return subtract(getAverageLocalPosition(fishId), fishLoc[fishId]);
}

function logicalUpdatesV1() {
	for (var i = 0; i < fishLoc.length; i++) {
        fishLoc[i] = add(fishLoc[i],fishVec[i]);
        
        for (var j = 0; j < 3; j++) {
            fishLoc[i][j] += fishVec[i][j];
            // TODO improve so that the fish emerges from the 'opposite' side
            if (fishLoc[i][j] > 1) {
                fishLoc[i][j] = -1
            } else if (fishLoc[i][j] < -1) {
                fishLoc[i][j] = 1;
            }
        }
    }
}

function logicalUpdatesV2() {
	for (var i = 0; i < fishLoc.length; i++) {
        //fishLoc[i] = add(fishLoc[i],fishVec[i]);
		//var newHeading = scale(sStrength, getSeparation(i)) + scale(cStrength, getCohesion(i)) + scale(aStrength, getAverageLocalHeading(i));
		var sepVec = getSeparation(i);
		var coVec = getCohesion(i);
		var alVec = getAverageLocalHeading(i);
		var fwVec = vec3(0.1, 0.0, 0.0);
		var newHeading = scale(sStrength, sepVec)
		newHeading = add(newHeading, scale(cStrength, coVec));
		newHeading = add(newHeading, scale(aStrength, alVec));
		newHeading = add(newHeading, scale(fStrength, fwVec));
		if (Math.random() < 0.05)
			newHeading = add(newHeading, scale(rStrength, vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1)));
		newHeading = add(newHeading, scale(pStrength, fishVec[i]));
		newHeading = scale(1.0/(aStrength + cStrength + sStrength + pStrength + fStrength + rStrength), newHeading);
		// max and min velocities
		var velSquared = dot(newHeading, newHeading);
		
		if (velSquared > maxSpeed ** 2) {
			newHeading = scale(maxSpeed/Math.sqrt(velSquared), newHeading);
		} else if (velSquared < minSpeed ** 2) {
			newHeading = scale(minSpeed/Math.sqrt(velSquared), newHeading);
		}
		
		fishVec[i] = newHeading;
		fishLoc[i] = add(fishLoc[i], newHeading);
        
        for (var j = 0; j < 3; j++) {
            //fishLoc[i][j] += fishVec[i][j];
            // TODO improve so that the fish emerges from the 'opposite' side
            if (fishLoc[i][j] > 1) {
                fishLoc[i][j] = -1
            } else if (fishLoc[i][j] < -1) {
                fishLoc[i][j] = 1;
            }
        }
    }
}



function updateFishMovement() {
	for (var i = 0; i < rotTail.length; i++) {
		rotTail[i] += incTail[i];
		if( rotTail[i] > 35.0  || rotTail[i] < -35.0 ) {
			incTail[i] *= -1;
		}
	}
}

function getRotTail(fishId) {
	return rotTail[fishId%3]
}

function getRotLeftFin(fishId) {
	return rotTail[(fishId+1)%3]
}

function getRotRigthFin(fishId) {
	var sign = 1.0;
	if (fishId % 2 == 0) sign = -1.0;
	return sign * rotTail[(fishId+1)%3]
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );
	mv = mult(mv, scalem(0.7,0.7,0.7));
    
    updateFishMovement();
    
	logicalUpdatesV2();
	
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv(locColor, flatten(vec4(1.0, 0.0, 0.0, 0.5)));

    gl.drawArrays( gl.LINES, 0, NumVertices/2 );
	gl.uniform4fv(locColor, flatten(vec4(0.0, 1.0, 0.0, 0.5)));
	gl.drawArrays( gl.LINES, NumVertices/2, NumVertices );

    
    // Fish start here
    for (var i = 0; i < fishLoc.length; i++) {
		var fishMv = mult( mv, translate(fishLoc[i][0], fishLoc[i][1], fishLoc[i][2]));
		// Make fish small 
		fishMv = mult( fishMv, scalem(fishSize, fishSize, fishSize));
		// When to change the fish direction?
		/*fishMv = mult( fishMv, translate(-fishLoc[i][0], 0, 0));
		var angle2 = Math.atan(fishVec[i][2]/fishVec[i][0])*360/(2*Math.PI);
		fishMv = mult( fishMv, rotateY(-angle2));
		fishMv = mult( fishMv, translate(fishLoc[i][0], 0, 0));*/
        
        gl.uniformMatrix4fv(matrixLoc, false, flatten(fishMv));

        gl.bindBuffer(gl.ARRAY_BUFFER, fBuffer);
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
		gl.uniform4fv(locColor, flatten(fishCol[i]));
        //gl.uniform4fv(locColor, flatten(vec4(0.2, 0.8, 1.0, 1.0)));

        gl.drawArrays(gl.TRIANGLES, 0, 2*3);
        
        // Finding the transformation matrix for the tail
        tailMv = mult( fishMv, translate(-0.5, 0, 0));
        tailMv = mult( tailMv, rotateY( getRotTail(i) ) );
        tailMv = mult( tailMv, translate(0.5, 0, 0));
        
        gl.uniformMatrix4fv(matrixLoc, false, flatten(tailMv));
        
        gl.drawArrays(gl.TRIANGLES, 2*3, 1*3);
        
        // The fins
        lfinMv = mult( fishMv, translate(-0.2, 0, 0));
        lfinMv = mult( lfinMv, rotateY( getRotLeftFin(i) ) );
        lfinMv = mult( lfinMv, translate(0.2, 0, 0));
        gl.uniformMatrix4fv(matrixLoc, false, flatten(lfinMv));
        
        gl.drawArrays(gl.TRIANGLES, 3*3, 1*3);
		
		rfinMv = mult( fishMv, translate(-0.2, 0, 0));
        rfinMv = mult( rfinMv, rotateY( getRotRigthFin(i) ) );
        rfinMv = mult( rfinMv, translate(0.2, 0, 0));
        gl.uniformMatrix4fv(matrixLoc, false, flatten(rfinMv));
        
        gl.drawArrays(gl.TRIANGLES, 4*3, 1*3);
		
    }
    
    //mv = mult( mv, translate(fishLoc[0], fishLoc[1], fishLoc[2]));

    requestAnimFrame( render );
}

