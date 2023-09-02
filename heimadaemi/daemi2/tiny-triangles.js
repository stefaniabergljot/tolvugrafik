/////////////////////////////////////////////////////////////////
//    Tölvugrafík - byggt á gasket1-lit
//
/////////////////////////////////////////////////////////////////
var gl;
var points;

// We need 3 points for each of the 100 triangles
var NumPoints = 300; 
var colorLoc;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Define the width and height of the triangles
    //

    var tri_width = 0.1;
    var tri_height = 0.1;
    
    points=[]

    for (var i = 0; points.length < NumPoints; ++i) {
        // Find a random left bottom coordinate
        // Then calculate the top and right bottom corner using the defined
        // height and width
        var x = 1 - 2*Math.random();
        var y = 1 - 2*Math.random();
        points.push(x, y, x+tri_width, y, x+0.5*tri_width, y+tri_height);
    }

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
    
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

	for (var i =0; i*3<points.length; ++i) {
        // For every triangle, generate a new color and dra it
        gl.uniform4fv( colorLoc, vec4(Math.random(), Math.random(), Math.random(), 1.0) );
        gl.drawArrays(gl.TRIANGLES, i*3, 3)
    }

}