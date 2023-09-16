/////////////////////////////////////////////////////////////////
//    Tölvugrafík - verkefni 1
//    September 2023
//    Stefanía Bergljót Stefánsdóttir
/////////////////////////////////////////////////////////////////
var gl;
var points = [];

var colorLoc;

// Game logic constants
const frogSpeed = 0.05;
const maxCars = 7;
const maxScore = 10;

const frog_width = 0.1;
const frog_height = 0.1;
const car_width = 0.3;
const car_height = 0.2;

// Game logic variables
var orientation = 0;
var cars = [];
var score = 0;
var gameOver = 0;
var frogLocation = vec2(0,-0.7 - frog_height);
var carColors = [];

const noLanes = 5;
const lowestCarTrack = -0.575;
const lineIncrement = car_height + 0.05;
const roadBoundaryLow = -0.625
const roadBoundaryHigh = lowestCarTrack + noLanes * lineIncrement;;
var laneSpeeds = [   0.03/3,
                    -0.01/3,
                    0.02/3,
                    -0.05/3,
                    0.03/3
                    ];   
var scoreboard;

const gray = vec4(0.5, 0.5, 0.5, 1.0);
const black = vec4(0.1, 0.1, 0.1, 1.0);
const green = vec4(0.4, 0.7, 0.4, 1.0);
const yellow = vec4(0.85, 0.85, 0.1, 1.0)

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
           
    // Drawing the background area
    drawSquare(vec2(-1, -1), 2, 2);
    drawSquare(vec2(-1, roadBoundaryLow), 2, roadBoundaryHigh-roadBoundaryLow);
    // Get the scoreboard element for displaying the score
    scoreboard = document.getElementById("scoreboard");
    scoreboard.innerHTML = "Score: " + score;
    
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
    
    // Controls for the frog
    // For every keystroke, update the frog's location
    // When it crosses the road boundary, increment score and check for win condition. 
    // At the end, check for collisions with cars. 
    window.addEventListener("keydown", function(event) {
        if (gameOver === 0) {
            if (event.code === "ArrowUp") {
                frogLocation[1] += frogSpeed;
                if (frogLocation[1] > 1 - frog_height) {
                    frogLocation[1] = 1 - frog_height;
                }
                if (frogLocation[1] > roadBoundaryHigh && orientation === 0) {
                    orientation = 1;
                    score++;
                    scoreboard.innerHTML = "Score: " + score;
                    if (score >= maxScore) {
                        endGame();

                    }
                }        
            } else if (event.code === "ArrowDown") {
                frogLocation[1] -= frogSpeed;
                if (frogLocation[1] < -1) {
                    frogLocation[1] = -1;
                }
                if (frogLocation[1]+frog_height < roadBoundaryLow && orientation === 1) {
                    orientation = 0;
                    score++;
                    scoreboard.innerHTML = "Score: " + score;
                    if (score >= maxScore) {
                        endGame();
                    }

                }
            } else if (event.code === "ArrowRight") {
                frogLocation[0] += frogSpeed;
                if (frogLocation[0] > 1 - frog_width) {
                    frogLocation[0] = 1 - frog_width;
                }
                
            } else if (event.code === "ArrowLeft") {
                frogLocation[0] -= frogSpeed;
                if (frogLocation[0] < -1) {
                    frogLocation[0] = -1;
                }   
            }
        }
        checkForCollision();
        return;
    })
    runGame();
};

function runGame() {
    // Reset everything except the background
    points.length = 8;
    refreshCarLocations();
    drawFrog();
    drawScore();
    drawCars();
    checkForCollision();
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    render();
    window.requestAnimFrame(runGame);    
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    // Background
    gl.uniform4fv( colorLoc, gray);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // Road
    gl.uniform4fv( colorLoc, black);
    gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
    // Frog
    gl.uniform4fv( colorLoc, green );
    gl.drawArrays(gl.TRIANGLES, 8, 3);
    // Score
    gl.uniform4fv( colorLoc, yellow );
    gl.drawArrays(gl.LINES, 11, score*2);
    // Cars
    var carIndex = 11+2*score;
    for (var i = 0; i < cars.length; ++i) {
        gl.uniform4fv( colorLoc, carColors[i]);
        gl.drawArrays(gl.TRIANGLE_STRIP, carIndex + 4*i, 4);
    }
}

function endGame() {
    gameOver = 1;
    if (score >= maxScore) {
        scoreboard.innerHTML = "You won! Well done. Final score: " + score;
    } else {
        scoreboard.innerHTML = "Game over! Final score: " + score;
    }
    
}

/*
checkForCollision checks if the frog's location overlaps with any cars. 
If so, it ends the game. 
*/
function checkForCollision() {
    for (var i = 0; i < cars.length; ++i) {
        var car = cars[i];
        if (((car[1] < frogLocation[1] && frogLocation[1] < car[1]+car_height)
                || (car[1] < frogLocation[1]+frog_height && frogLocation[1]+frog_height < car[1]+car_height))
                && ((car[0] < frogLocation[0] && frogLocation[0] < car[0]+car_width) 
                || (car[0] < frogLocation[0]+frog_width && frogLocation[0]+frog_width < car[0]+car_width))) {
            // Collision detected!
            endGame();
            return;
        }
    }
}

/*
refreshCarLocations moves every car's x coordinate one step in the car's direction. 
Then, it iterates over the cars and deletes all that have moved off the grid. 
Finally, if the number of remaining cars is less than the car max, it has a chance of 
spawning a new car. 
*/
function refreshCarLocations() {
    if (gameOver === 0) {
        for (var i = 0; i < cars.length; ++i) {
            var car = cars[i];
            car[0] += car[2];
        }
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
                attemptSpawnCar();
            }
        }
    }
}


function attemptSpawnCar() {
    var emptyLanes = [];
    for (var lane = 0; lane < noLanes; ++lane) {
        var lineYCoordinate = lowestCarTrack + lane*lineIncrement;
        if (isLineEmpty(lineYCoordinate)) {
            emptyLanes.push(lane);
        }
    }
    var lane;
    if (emptyLanes.length > 0) {
        // Pick random empty lane
        lane = emptyLanes[Math.floor(Math.random()*emptyLanes.length)];
    } else {
        // Pick random lane, since all are non-empty
        lane = Math.floor(Math.random()*noLanes);
    }
    
    // var lane = Math.floor(Math.random()*noLanes);
    var line = lowestCarTrack + lane*lineIncrement;
    
    var startingPoint = -laneSpeeds[lane]/Math.abs(laneSpeeds[lane]);
    if (startingPoint === -1) {
        startingPoint -= car_width;
    }
    
    // Iterate over all the cars and check if the new car would overlap with them
    // If so, give up - the function will be called again in the next cycle
    // Only necessary when spawning on a non-empty lane
    var spacing = 0.05;
    if (emptyLanes.length == 0) {
        for (var i = 0; i < cars.length; ++i) {
            var car = cars[i];
            if (car[1] === line) {
                if (laneSpeeds[lane] > 0) {
                    // cars are travelling right
                    if (car[0] - car_width < (startingPoint + spacing)) {
                        return;
                    }
                } else {
                    // cars are travelling left
                    if (car[0] + car_width > (1 - spacing)) {
                        return;
                    }
                }
            }
        }
    }
    
    cars.push(vec3(startingPoint, line, laneSpeeds[lane]));
    carColors.push(randomColor());
}

function isLineEmpty(yCoord) {
    for (var i = 0; i < cars.length; ++i) {
        if (cars[i][1] == yCoord) {
            return false;
        }       
    }
    return true;
}

function drawCars() {
    for (var i = 0; i < cars.length; ++i) {
        var car = cars[i];
        drawSquare(vec2(car[0], car[1]), car_width, car_height);
    }
}

function squareAsTriangleStrip(a, b, c, d) {
    points.push(a, b, c, d);
}

function drawSquare(coord, width, height) {
    squareAsTriangleStrip(
        coord, 
        vec2(coord[0]+width, coord[1]),
        vec2(coord[0], coord[1]+height),
        vec2(coord[0]+width, coord[1]+height),
    );
}

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function line(a, b) {
    points.push(a, b)
}

// Unused
function squareAsTwoTriangles(a, b, c, d) {
    points.push( a, b, c );
    points.push( c, d, a );
}

function drawFrog(){
    var coord = frogLocation;
    if (orientation === 0) {
        triangle(coord,
            vec2(coord[0]+frog_width, coord[1]),
            vec2(coord[0]+0.5*frog_width, coord[1]+frog_height));
    } else {
        triangle(
            vec2(coord[0], coord[1]+frog_height),
            vec2(coord[0]+frog_width, coord[1]+frog_height),
            vec2(coord[0]+0.5*frog_width, coord[1]));
    }
}

function drawScore() {
    var x = -0.95;
    var y = 0.95;
    for (var i = 0; i < score; ++i) {
        line(vec2(x+i*0.035,y), vec2(x+i*0.035,y-0.07));
    }
}

function randomColor() {
    // Avoid dark colors for contrast
    var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
    return mix(color, vec4(1.0, 1.0, 1.0, 1.0), 0.15);
}