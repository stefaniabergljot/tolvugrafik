/////////////////////////////////////////////////////////////////
//    Tölvugrafík - byggt á gasket1-lit
//
/////////////////////////////////////////////////////////////////
var gl;
var points;

var colorLoc;
var tri_width = 0.1;
var tri_height = 0.1;
var car_width = 0.3;
var car_height = 0.2;
var increment = 0.05;
var orientation = 0;
var maxCars = 5;
var cars = [];

var bottomCarLine = -0.575;
var bottomLine = -0.625
var topLine = 0.625;
var noLanes = 5;
//var lineIncrement = (topLine-bottomLine)/noLanes;
var lineIncrement = car_height + 0.05;
var laneRules = []
var gameOver = 0;
var frogLocation; 
var score = 0;
var scoreboardElement;
var carColors = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
   
    points=[]
    var carArray = [];
    frogLocation = vec2(0,-0.7 - tri_height);
    topLine = bottomCarLine + noLanes * lineIncrement;

    
    // predefined lane rules
    laneRules = [   vec2(0.03/3, 1), 
                    vec2(0.01/3, -1), 
                    vec2(0.02/3, 1),
                    vec2(0.05/3, -1),
                    vec2(0.03/3, 1)
                    ];
    
    drawSquare(vec2(-1, -1), 2, 2);
    drawSquare(vec2(-1, bottomLine), 2, topLine-bottomLine);
    drawFrog(frogLocation);
    
    // Each car has a coordinate, speed and direction (optional: color)
    /*cars = [vec4(-1, bottomCarLine+lineIncrement, 0.03, -1),
                vec4(1, bottomCarLine+2*lineIncrement, 0.01, 1),
                vec4(-1, bottomCarLine, 0.02, 1)
    ];
    carColors = [randomColor(), randomColor(), randomColor()];*/
    
    scoreboardElement = document.getElementById("scoreboard");
    scoreboardElement.innerHTML = "Score: " + score;

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
    function endGame() {
        document.getElementById("scoreboard").innerHTML = "Game over! Final score: " + score;
    }
    window.addEventListener("keydown", function(event) {
        if (gameOver === 0) {
            if (event.code === "ArrowUp") {
                frogLocation[1] += increment;
                if (frogLocation[1] > 1 - tri_height) {
                    frogLocation[1] = 1 - tri_height;
                }
                if (frogLocation[1] > topLine && orientation === 0) {
                    orientation = 1;
                    score++;
                    document.getElementById("scoreboard").innerHTML = "Score: " + score;
                }        
            } else if (event.code === "ArrowDown") {
                frogLocation[1] -= increment;
                if (frogLocation[1] < -1) {
                    frogLocation[1] = -1;
                }
                if (frogLocation[1] < bottomLine && orientation === 1) {
                    orientation = 0;
                    score++;
                    document.getElementById("scoreboard").innerHTML = "Score: " + score;
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
        }
        checkForCollision(cars, frogLocation);
        return;
    })
    runGame();
    
    /*window.setInterval(function() {
        points.length = 12;
        refreshCarLocations();
        drawFrog(frogLocation);
        drawCars(cars);
        checkForCollision(cars, frogLocation);
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
        render()
    }, 50);*/
};

function checkForCollision(cars, frogLocation, scoreboardElement) {
    /*collidingCars = cars.filter(
        car => ((car[1] < frogLocation[1] && frogLocation[1] < car[1]+car_height)
            || (car[1] < frogLocation[1]+tri_height && frogLocation[1]+tri_height < car[1]+car_height))
            && ((car[0] < frogLocation[0] && frogLocation[0] < car[0]+car_width) 
            || (car[0] < frogLocation[0]+tri_width && frogLocation[0]+tri_width < car[0]+car_width))
    );
    if (collidingCars.length > 0) {
        gameOver = 1;
        scoreboard.innerHTML = "Game over! Final score: " + score;
    }*/
    for (var i = 0; i < cars.length; ++i) {
        var car = cars[i];
        if (((car[1] < frogLocation[1] && frogLocation[1] < car[1]+car_height)
                || (car[1] < frogLocation[1]+tri_height && frogLocation[1]+tri_height < car[1]+car_height))
                && ((car[0] < frogLocation[0] && frogLocation[0] < car[0]+car_width) 
                || (car[0] < frogLocation[0]+tri_width && frogLocation[0]+tri_width < car[0]+car_width))) {
            // Collision detected!
            gameOver = 1;
            scoreboard.innerHTML = "Game over! Final score: " + score;
            return;
        }
    }
}

function refreshCarLocations() {
    if (gameOver === 0) {
        for (var i = 0; i < cars.length; ++i) {
            var car = cars[i];
            car[0] += car[3]*car[2];
        }
        /*var liveCars = cars.filter(
            car => car[0] <= 1 && car[0] + car_width >= -1
        );
        cars = liveCars;*/
        var i = 0;
        while (true) {
            if (i >= cars.length) {
                break;
            }
            var car = cars[i];
            if (!(car[0] <= 1 && car[0] + car_width >= -1)) {
                // Car is off the grid
                cars.splice(i, 1);
                carColors.splice(i, 1);
            } else {
                ++i;
            }
            
        }
        if (cars.length < maxCars) {
            if (Math.random() < 0.05) {
                spawnCar(cars);
            }
        }
    }
} 

function spawnCar(cars) {
    // var line = Math.floor(Math.random()*3);
    var lane = Math.floor(Math.random()*noLanes)
    var line = bottomCarLine + lane*lineIncrement;
    
    var startingPoint = -laneRules[lane][1];
    if (startingPoint === -1) {
        startingPoint -= car_width;
    }
    
    for (var i = 0; i < cars.length; ++i) {
        var car = cars[i];
        if (car[1] === line) {
            if (laneRules[lane][1] === 1) {
                // cars are travelling right
                if (car[0] - car_width < startingPoint) {
                    return;
                }
            } else {
                // cars are travelling left
                if (car[0] + car_width > 1) {
                    return;
                }
            }
        }
    }
    
    //cars.push(vec4(-laneRules[lane][1], line, laneRules[lane][0], laneRules[lane][1]));
    cars.push(vec4(startingPoint, line, laneRules[lane][0], laneRules[lane][1]));
    carColors.push(randomColor());
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

function runGame() {
    points.length = 12;
    refreshCarLocations();
    drawFrog(frogLocation);
    drawCars(cars);
    checkForCollision(cars, frogLocation);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    render();
    window.requestAnimFrame(runGame);    
}

function randomColor() {
    return vec4(Math.random(), Math.random(), Math.random(), 1.0);
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    gl.uniform4fv( colorLoc, vec4(Math.random(), Math.random(), Math.random(), 1.0) );

    var gray = vec4(0.5, 0.5, 0.5, 1.0);
    var black = vec4(0.1, 0.1, 0.1, 1.0);
    var green = vec4(0.4, 0.7, 0.4, 1.0);
    
    // Background
    gl.uniform4fv( colorLoc, gray);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // Road
    gl.uniform4fv( colorLoc, black);
    gl.drawArrays(gl.TRIANGLES, 6, 12);
    // Frog
    gl.uniform4fv( colorLoc, green );
    gl.drawArrays(gl.TRIANGLES, 12, 15);
    // Cars
    /*for (var i = 15; i + 6 < points.length; i += 6) {
        gl.uniform4fv( colorLoc, carColors[(i - 15)/6]);
        gl.drawArrays(gl.TRIANGLES, i, i+6);
    }*/
    for (var i = 0; i < (points.length-15 - 5)/6;++i) {
        gl.uniform4fv( colorLoc, carColors[i]);
        gl.drawArrays(gl.TRIANGLES, 15 + 6*i, 6);
    }
    //gl.drawArrays(gl.TRIANGLES, 15, points.length-15);
    
	/*for (var i =0; i*3<points.length; ++i) {
        gl.uniform4fv( colorLoc, vec4(Math.random(), Math.random(), Math.random(), 1.0) );
        gl.drawArrays(gl.TRIANGLES, i*3, 3)
    }*/

}