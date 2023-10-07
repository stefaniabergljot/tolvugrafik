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

var rotTail = 0.0;        // Snuningshorn spords
var incTail = 2.0;        // Breyting a snuningshorni

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
    var vertices = [
        vec3( -0.6, -0.6,  0.6 ),
        vec3( -0.6,  0.6,  0.6 ),
        vec3(  0.6,  0.6,  0.6 ),
        vec3(  0.6, -0.6,  0.6 ),
        vec3( -0.6, -0.6, -0.6 ),
        vec3( -0.6,  0.6, -0.6 ),
        vec3(  0.6,  0.6, -0.6 ),
        vec3(  0.6, -0.6, -0.6 )
    ];
    
    points.push(vertices[a], vertices[b]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    
    
}

var fishLoc = [
    vec3(0.3, 0.3, 0.3),
    vec3(0.1, 0.1, 0.1),
    vec3(-0.3, 0.4, 0.7),
];

var fishVec = [
    vec3(0.001, 0.001, 0.001),
    vec3(0.001, 0.0, 0.0),
    vec3(-0.001, 0.0, 0.001),
];

var fishCol = [
    vec4(0.2, 0.8, 1.0, 1.0),
    vec4(0.2, 0.6, 0.9, 1.0),
    vec4(0.3, 0.7, 0.9, 1.0),
];

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    var mv = mat4();
    mv = mult( mv, rotateX(spinX) );
    mv = mult( mv, rotateY(spinY) );
    
    rotTail += incTail;
    if( rotTail > 35.0  || rotTail < -35.0 )
        incTail *= -1;
    for (var i = 0; i < fishLoc.length; i++) {
        fishLoc[i][0] += fishVec[i][0];
        fishLoc[i][1] += fishVec[i][1];
        fishLoc[i][2] += fishVec[i][2];
        
        for (var j = 0; j < 3; j++) {
            fishLoc[i][j] += fishVec[i][j];
            // TODO improve so that the fish emerges from the 'opposite' side
            if (fishLoc[i][j] > 1) {
                fishLoc[i][j] = -1
            } else if (fishLoc[i][j] < -1) {
                fishLoc[i][j] = 1;
            }
        }
        
        /*if (Math.max(
            Math.abs(fishLoc[i][0]), Math.abs(fishLoc[i][1]), Math.abs(fishLoc[i][2]) 
        ) > 1 ) {
            fishLoc[i][0] *= -1;
            fishLoc[i][0] *= -1;
            fishLoc[i][0] *= -1;
        }*/
    }
    
    gl.uniformMatrix4fv(matrixLoc, false, flatten(mv));

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.uniform4fv(locColor, flatten(vec4(1.0, 0.0, 0.0, 1.0)));

    gl.drawArrays( gl.LINES, 0, NumVertices );
    
    // Fish start here
    for (var i = 0; i < fishLoc.length; i++) {
        var fishMv = mult( mv, translate(fishLoc[i][0], fishLoc[i][1], fishLoc[i][2]));
        
        gl.uniformMatrix4fv(matrixLoc, false, flatten(fishMv));

        gl.bindBuffer(gl.ARRAY_BUFFER, fBuffer);
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.uniform4fv(locColor, flatten(vec4(0.2, 0.8, 1.0, 1.0)));

        gl.drawArrays(gl.TRIANGLES, 0, 2*3);
        
        // Finding the transformation matrix for the tail
        tailMv = mult( fishMv, translate(-0.5, 0, 0));
        tailMv = mult( tailMv, rotateY( rotTail ) );
        tailMv = mult( tailMv, translate(0.5, 0, 0));
        
        gl.uniformMatrix4fv(matrixLoc, false, flatten(tailMv));
        
        gl.drawArrays(gl.TRIANGLES, 2*3, 1*3);
        
        // The fins
        finMv = mult( fishMv, translate(-0.2, 0, 0));
        finMv = mult( finMv, rotateY( rotTail ) );
        finMv = mult( finMv, translate(0.2, 0, 0));
        gl.uniformMatrix4fv(matrixLoc, false, flatten(finMv));
        
        gl.drawArrays(gl.TRIANGLES, 3*3, 2*3);
    }
    
    //mv = mult( mv, translate(fishLoc[0], fishLoc[1], fishLoc[2]));

    requestAnimFrame( render );
}

