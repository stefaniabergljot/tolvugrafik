/////////////////////////////////////////////////////////////////
//    Fish flocking behaviour
//    Stefanía Bergljót Stefánsdóttir
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var locColor;

// Borrowed from cube-red, for changing the perspective
var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var vBuffer;
var vPosition;
var fBuffer;
var matrixLoc;

// Random tail and fin moving spees
var rotTail = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];        // Snuningshorn spords
var incTail = [1.1, 2.0, 2.3, 0.7, 1.6, 1.3];        // Breyting a snuningshorni

var fishLoc = [];
var fishVec = [];
var fishCol = [];

// Weights and distances for determining fish behaviour
var aStrength = 0.25;
var cStrength = 0.35;
var sStrength = 0.6;
var pStrength = 0.0;
var fStrength = 0.0;

var minSpeed = 0.0015;
var maxSpeed = 0.003;

var coDistance = 0.7;
var alDistance = 0.7;
var sepDistance = 0.3;
var fishSize = 0.6;
var sharkAversionDistance = 0.3;

// IDs of custom fish
var rogue = -1;
var shark = -1;
// Counter for determining shark behaviour
var sharkCounter = 0;

// Used for smoothing the displayed angles of the fish
var angleQueue = [];
var anglePreservation = 1000;
var showDirection = true;

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
	
	var numFish = 5;
	for (var i = 0; i < numFish; i++) {
		createFish();
	}
    
    locColor = gl.getUniformLocation(program, "rColor");
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    fBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fBuffer);
    
	// Fish model
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

    // Event listeners for mouse
	// Borrowed from the cube-red.js example
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
	
	// Sliders and buttons for configuring the flocking behaviours
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
	document.getElementById("sharkAversionNeighbourhood").onchange = function(event) {
		sharkAversionDistance = parseFloat(event.target.value);
	};
	document.getElementById("addFish").onclick = function(){
		createFish();
	};
	document.getElementById("addRogue").onclick = function(){
		if (rogue < 0) {
			var id = createFish()
			fishCol[id] = vec4(0.86, 0.37, 0.53, 1.0);
			rogue = id;
		}
	};
	document.getElementById("removeRogue").onclick = function(){
		if (rogue > -1 ) {
			if (shark > rogue) {
				shark--;
			}
			fishLoc.splice(rogue, 1);
			fishVec.splice(rogue, 1);
			fishCol.splice(rogue, 1);
			angleQueue.splice(rogue, 1);
			rogue = -1;	
		}
	}
	document.getElementById("addShark").onclick = function(){
		if (shark < 0) {
			var id = createFish();
			fishCol[id]= vec4(0.1, 0.1, 0.2, 1.0);
			shark = id;
		}
	};
	document.getElementById("removeShark").onclick = function(){
		if (shark > -1 ) {
			if (rogue > shark) {
				rogue--;
			}
			fishLoc.splice(rogue, 1);
			fishVec.splice(shark, 1);
			fishCol.splice(shark, 1);
			shark = -1;	
			angleQueue.splice(shark, 1);
		}
	}

	document.getElementById("removeFish").onclick = function(){
		if (rogue == fishLoc.length - 1) {
			rogue = -1;
		}
		if (shark == fishLoc.length - 1) {
			shark = -1;
		}
		fishLoc.pop();
		fishVec.pop();
		fishCol.pop();
		angleQueue.pop();
	};
	document.getElementById("showDirection").onclick = function() {
		showDirection = !showDirection;
	}
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

// Creates a fish with random position, heading and color
function createFish() {
	fishLoc.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
	fishVec.push(vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
	fishCol.push(vec4(Math.random()*0.3, Math.random()*0.38+0.5, Math.random()*0.3+0.7, 1.0));
	angleQueue.push([]);
	return fishLoc.length - 1;
}

/*
Functions for rendering the box
*/
function colorCube()
{
    line(0, 1);
    line(1,2);
    line(2, 3);
    line(3, 0);
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
    
    
}

/*
Functions for flocking behaviour
*/

// Returns ids of all fish within the given distance from fishId, excluding it
function getLocalFlockmates(fishId, neighbourhood) {
    var localFlockmates = [];
	for (var i = 0; i < fishLoc.length; i++) {
		if (i == fishId || i == shark) {
			continue;
		}
		var dist = subtract(fishLoc[i], fishLoc[fishId]);
		if (dot(dist,dist) <= neighbourhood ** 2) {
			localFlockmates.push(i);
		}
	}
	return localFlockmates;
} 

// Returns average heading of all fish within distance
function getAlignment(fishId) {
	var sum = vec3(0, 0, 0);
	var localFlockmates = getLocalFlockmates(fishId, alDistance);
	if (localFlockmates.length == 0) {
		return fishVec[fishId];
	}
	for (var i = 0; i < localFlockmates.length; i++) {
		var id = localFlockmates[i];
		sum = add(sum, fishVec[id]);
	}
	var f = 1.0/localFlockmates.length;
	return scale(f, sum);
}

// Returns average location of all fish within distance
function getAverageLocalPosition(fishId) {
	var sum = vec3(0, 0, 0);
	var localFlockmates = getLocalFlockmates(fishId, coDistance);
	if (localFlockmates.length == 0) {
		return fishLoc[fishId];
	}
	for (var i = 0; i < localFlockmates.length; i++) {
		var id = localFlockmates[i];
		sum = add(sum, fishLoc[id]);
	}
	var f = 1.0/localFlockmates.length;
	return scale(f, sum);
}

// Returns average vector away from fish within distance
function getSeparation(fishId) {
	var sum = vec3(0,0,0);
	var localFlockmates = getLocalFlockmates(fishId, sepDistance);
	if (localFlockmates.length == 0) {
		return vec3(0,0,0);
	}
	for (var i = 0; i < localFlockmates.length; i++) {
		var id = localFlockmates[i];
		// vector away from neighbour
		var v = subtract(fishLoc[fishId],fishLoc[id]);
		sum = add( sum, v );
	}
	var f = 1.0/localFlockmates.length;
	return scale(f, sum);
}

// Cohesion is the vector from the fish to its average neighbour location
function getCohesion(fishId) {
	return subtract(getAverageLocalPosition(fishId), fishLoc[fishId]);
}

// Returns heading away from shark
function getSharkAversionVector(fishId) {
	return scale(maxSpeed, normalize(subtract(fishLoc[fishId], fishLoc[shark])));
}

// Returns a mix of the current heading and a random vector
function getRandomHeadingChange(fishId) {
	var rand = vec3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
	return mix(fishVec[fishId], rand, 0.0005);
}

// Chases every 1/1000 iterations, it gives the heading towards the closest fish
// The rest of the time it returns the current heading
function getSharkPursuitVector() {
	if (sharkCounter >= 1000) {
		sharkCounter = 0;
		var min = 10000;
		newheading = vec3(0,0,0);
		for (var j = 0; j < fishLoc.length; j++) {
			if (j != shark) {
				var current = length(subtract(fishLoc[j], fishLoc[shark]));
				if (current < min) {
					min = current; 
					newHeading = subtract(fishLoc[j], fishLoc[shark]);
				}
				
			}
		}
		return setSpeed(maxSpeed, newHeading);
	}
	sharkCounter++;
	return setSpeed(maxSpeed, fishVec[shark]);
}

// Returns the distance between the fish and the shark
function getSharkDistance(fishId) {
	if (shark == -1) {
		return 1000;
	}
	return length(subtract(fishLoc[fishId], fishLoc[shark]));
}

// Scales up or down to the max or min speed, of outside of range
function applySpeedLimits(heading) {
	var speed = length(heading);
		if (speed == 0.0) {
			heading = vec3(0.000000001, 0.000000001, 0.000000001);
		}
		if (speed > maxSpeed) {
			heading = setSpeed(maxSpeed, heading);
		} else if (speed < minSpeed) {
			heading = setSpeed(minSpeed, heading);
		}
	return heading;
}

// Scales the vector up or down - if 0 vector, it replaces it with a very small vector
function setSpeed(speed, heading) {
	if (length(heading) == 0.0) {
		heading = vec3(0.000000001, 0.000000001, 0.000000001);
	}
	return scale(speed, normalize(heading));
}

// Returns weighted average of the heading vectors
function getDefaultFishVector(fishId) {
	// Basic
	var newHeading = scale(sStrength, getSeparation(fishId));
	newHeading = add(newHeading, scale(cStrength, getCohesion(fishId)));
	newHeading = add(newHeading, scale(aStrength, getAlignment(fishId)));
	
	newHeading = add(newHeading, scale(pStrength, fishVec[fishId]));
	newHeading = add(newHeading, scale(fStrength, vec3(0.1, 0, 0)));
	
	if (aStrength + cStrength + sStrength + pStrength + fStrength > 0) {
		newHeading = scale(1.0/(aStrength + cStrength + sStrength + pStrength + fStrength), newHeading);

	}
	
	return newHeading;
}

// Updates all fish locations
function updateFish() {
	for (var fishId = 0; fishId < fishLoc.length; fishId++) {
		var newHeading;
		if (fishId != rogue && fishId != shark && getSharkDistance(fishId) > sharkAversionDistance) {
			// This is the default behaviour
			newHeading = applySpeedLimits(getDefaultFishVector(fishId));
		} else if (fishId != shark && getSharkDistance(fishId) <= sharkAversionDistance) {
			// Behaviour if chased by a shark
			newHeading = setSpeed(maxSpeed*1.2, mix(getSharkAversionVector(fishId), applySpeedLimits(getDefaultFishVector(fishId)), 0.2));
		} else if (fishId == rogue) {
			// Random behaviour from rogue fish
			newHeading = applySpeedLimits(getRandomHeadingChange(fishId));
		} else if (fishId == shark) {
			// Shark behaviour
			newHeading = getSharkPursuitVector();
		}

		fishVec[fishId] = newHeading;
		fishLoc[fishId] = add(fishLoc[fishId], newHeading);
        
        for (var j = 0; j < 3; j++) {
            // Emerge from 'opposite' side
            if (fishLoc[fishId][j] > 1) {
                fishLoc[fishId][j] = -1
            } else if (fishLoc[fishId][j] < -1) {
                fishLoc[fishId][j] = 1;
            }
        }
    }
}

/*
Functions for fish visualization
*/
function updateFishVisualization() {
	for (var i = 0; i < rotTail.length; i++) {
		rotTail[i] += incTail[i];
		if( rotTail[i] > 35.0  || rotTail[i] < -35.0 ) {
			incTail[i] *= -1;
		}
	}
}

function getRotTail(fishId) {
	return rotTail[fishId%6]
}

function getRotLeftFin(fishId) {
	return rotTail[fishId%5]
}

function getRotRigthFin(fishId) {
	var sign = 1.0;
	if (fishId % 2 == 0) sign = -1.0;
	return sign * rotTail[fishId%5]
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );
	mv = mult(mv, scalem(0.7,0.7,0.7));
    
    updateFishVisualization();
    
	updateFish();
	
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv(locColor, flatten(vec4(0.0, 0.0, 0.0, 0.5)));

    gl.drawArrays( gl.LINES, 0, NumVertices );

    
    // Fish start here
    for (var i = 0; i < fishLoc.length; i++) {
		var fishMv = mult( mv, translate(fishLoc[i][0], fishLoc[i][1], fishLoc[i][2]));
		// Make fish small 
		var sz = fishSize;
		if (i == shark) {
			sz += 0.1;
		}
		fishMv = mult( fishMv, scalem(sz, sz, sz));
		if (showDirection) {
			// To display the headings of the fish more smoothly, we keep track of their headings
			// in previous iterations and calculate the average
			angleQueue[i].push(fishVec[i]);

			if (angleQueue[i].length > anglePreservation) {
				var oldVec = angleQueue[i].shift();
				
			}
			var avHistoryVector = getAverageVector(i);
			fishMv = mult( fishMv, rotate(getAngle(avHistoryVector), [0, 1, 0])); // Rotates in xz axis
		}
        
        gl.uniformMatrix4fv(matrixLoc, false, flatten(fishMv));

        gl.bindBuffer(gl.ARRAY_BUFFER, fBuffer);
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
		gl.uniform4fv(locColor, flatten(fishCol[i]));

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
    
    requestAnimFrame( render );
}

/*
Other helper functions
*/
function average(arr) {
	var count = 0;
	var sum = 0;
	for (var i = 0; i < arr.length; i++) {
		count += 1;
		sum += arr[i];
	};
	if (count > 0) {
		return sum/count;
	}
	return null;
}

function getAverageVector(fishId) {
	var angles = angleQueue[fishId];
	var sum = vec3(0.0, 0.0, 0.0);
	var count = 0;
	for (var i = 0; i < angles.length; i++) {
		for (var j = 0; j < 3; j++) {
		    sum[j] += angles[i][j];
		}
		count += 1
	}
	if (count > 0) {
		return scale(1.0/count, sum);
	}
	return 0;
}

function getAngle(v) {
	if (length(v) == 0.0) {
		return 0;
	}
	var angle = Math.atan(Math.abs(v[2])/Math.abs(v[0]))*360/(2*Math.PI);
	
	// There is probably a better way of calculating this
	// but I am too scared to touch this again
	if (v[0] > 0 && v[2] > 0) angle *= -1; // 
	if (v[0] > 0 && v[2] < 0) angle *= 1;
	if (v[0] < 0 && v[2] > 0) angle -= 180;
	if (v[0] < 0 && v[2] < 0) angle = 180 - angle;
	return angle;
}