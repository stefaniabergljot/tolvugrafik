/////////////////////////////////////////////////////////////////
//    Tölvugrafík - byggt á gasket1-lit
//
/////////////////////////////////////////////////////////////////
var gl;
var points;

var colorLoc;
var tri_width = 0.1;
var tri_height = 0.1;
var car_width = 0.2;
var car_height = 0.2;
var increment = 0.05;
var orientation = 0;
var maxCars = 4;
var cars = [];

var bottomCarLine = -0.45;
var bottomLine = -0.5
var topLine = 0.5;
var noLanes = 3;
var lineIncrement = (topLine-bottomLine)/noLanes;
var laneRules = []

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    points=[]
    var carArray = [];
    var frogLocation = vec2(0,-0.65);
    
    // predefined lane rules
    laneRules = [vec2(0.03, 1), vec2(0.01, -1), vec2(0.02, 1)];
    
    drawSquare(vec2(-1, -1), 2, 2);
    drawSquare(vec2(-1, bottomLine), 2, topLine-bottomLine);
    drawFrog(frogLocation);
    
    // Each car has a coordinate, speed and direction (optional: color)
    cars = [vec4(-1, bottomCarLine+lineIncrement, 0.03, -1),
                vec4(1, bottomCarLine+2*lineIncrement, 0.01, -0),
                vec4(-1, bottomCarLine, 0.02, 1)
    ];
    
    var score = 0;

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Find the location of the variable fColor in the shader program
    colorLoc = gl.getUniformLocation( program, "fColor" );
    
    window.addEventListener("keydown", function(event) {
        if (event.code === "ArrowUp") {
            frogLocation[1] += increment;
            if (frogLocation[1] > 1 - tri_height) {
                frogLocation[1] = 1 - tri_height;
            }
            if (frogLocation[1] > topLine && orientation === 0) {
                orientation = 1;
                score++;
            }
            
        } else if (event.code === "ArrowDown") {
            frogLocation[1] -= increment;
            if (frogLocation[1] < -1) {
                frogLocation[1] = -1;
            }
            if (frogLocation[1] < bottomLine && orientation === 1) {
                orientation = 0;
                score++;
            }
        } else if (event.code === "ArrowRight") {
            frogLocation[0] += increment;
            if (frogLocation[0] > 1 - tri_width) {
                frogLocation[0] = 1 - tri_width;
            }
            
        } else if (event.code === "ArrowLeft") {
            frogLocation[0] -= increment;
            if (frogLocation[0] < -1) {
                frogLocation[0] = -1;
            }
            
        }
        return;
    })
    
    window.setInterval(function() {
        points.length = 12;
        refreshCarLocations();
        drawFrog(frogLocation);
        drawCars(cars);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
        render()
    }, 50);
};

function refreshCarLocations() {
    for (var i = 0; i < cars.length; ++i) {
        var car = cars[i];
        car[0] += car[3]*car[2];
    }
    var liveCars = cars.filter(
        car => car[0] <= 1 && car[0] + car_width >= -1
    );
    cars = liveCars;
    if (liveCars.length < maxCars) {
        if (Math.random() < 0.1) {
            spawnCar(cars);
        }
    }
} 

function spawnCar(cars) {
    // var line = Math.floor(Math.random()*3);
    var lane = Math.floor(Math.random()*noLanes)
    var line = bottomCarLine + lane*lineIncrement;
    
    cars.push(vec4(-laneRules[lane][1], line, laneRules[lane][0], laneRules[lane][1]));
}

function drawCars(cars) {
    for (var i = 0; i < cars.length; ++i) {
        var car = cars[i];
        drawSquare(vec2(car[0], car[1]), car_width, car_height);
    }
}

function drawSquare(coord, width, height) {
    squareAsTwoTriangles(
        coord, 
        vec2(coord[0]+width, coord[1]),
        vec2(coord[0]+width, coord[1]+height),
        vec2(coord[0], coord[1]+height)
        );
}

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function squareAsTwoTriangles(a, b, c, d) {
    points.push( a, b, c );
    points.push( c, d, a );
}

function drawFrog(coord){
    if (orientation === 0) {
        triangle(coord,
            vec2(coord[0]+tri_width, coord[1]),
            vec2(coord[0]+0.5*tri_width, coord[1]+tri_height));
    } else {
        triangle(
            vec2(coord[0], coord[1]+tri_height),
            vec2(coord[0]+tri_width, coord[1]+tri_height),
            vec2(coord[0]+0.5*tri_width, coord[1]));
    }
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.uniform4fv( colorLoc, vec4(Math.random(), Math.random(), Math.random(), 1.0) );

    var gray = vec4(0.5, 0.5, 0.5, 1.0);
    var black = vec4(0.1, 0.1, 0.1, 1.0);
    var green = vec4(0.4, 0.7, 0.4, 1.0);
    
    gl.uniform4fv( colorLoc, gray);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.uniform4fv( colorLoc, black);
    gl.drawArrays(gl.TRIANGLES, 6, 12);
    gl.uniform4fv( colorLoc, green );
    gl.drawArrays(gl.TRIANGLES, 12, 15);
    gl.drawArrays(gl.TRIANGLES, 15, points.length-15);
    
	/*for (var i =0; i*3<points.length; ++i) {
        gl.uniform4fv( colorLoc, vec4(Math.random(), Math.random(), Math.random(), 1.0) );
        gl.drawArrays(gl.TRIANGLES, i*3, 3)
    }*/

}