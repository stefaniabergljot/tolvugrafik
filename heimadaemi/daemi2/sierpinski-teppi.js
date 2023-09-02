"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, -1 ),
        vec2(  -1,  1 ),
        vec2(  1, 1 ),
        vec2(  1, -1) 
    ];
    //var points = [];

    //points.push(vec2(-0.1, -0.1), vec2(-0.1,0,0), vec2(0.1,0.1));
    divideSquare( vertices[0], vertices[1], vertices[2], vertices[3],
                    NumTimesToSubdivide);

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

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function triangle( a, b, c )
{
    points.push( a, b, c );
}

function twotriangles(a, b, c, d) {
    points.push( a, b, c );
    points.push( c, d, a );
}

function divideSquare( a, b, c, d, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        twotriangles( a, b, c , d);
    }
    else {

        --count;
        
        // eight new squares
        var up = vec2(0, (b[1]-a[1])/3);
        var right = vec2((d[0]-a[0])/3, 0);
        for (var x = 0; x < 3; ++x) {
            for (var y = 0; y < 3; ++y) {
                if (x != 1 || y != 1) {
                    divideSquare(add(add(a, scale(x, right)), scale(y, up)),
                    add(add(a, scale(x, right)), scale(y+1, up)),
                    add(add(a, scale(x+1, right)), scale(y+1, up)),
                    add(add(a, scale(x+1, right)), scale(y, up)), count);              
                }
            }
        }
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}