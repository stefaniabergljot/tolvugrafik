/////////////////////////////////////////////////////////////////
//    S�nislausn � d�mi 4 � heimad�mum 4 � T�lvugraf�k
//     S�nir kollust�linn SAKARIAS til �r fimm teningum.
//
//    Hj�lmt�r Hafsteinsson, september 2023
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];

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

var matrixLoc;
var modelViewMatrix;
var normalMatrix, normalMatrixLoc;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.7, 0.8, 0.8, 1.0 );
var materialDiffuse = vec4( 0.6, 0.8, 0.6, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialShininess = 150.0;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    //var vColor = gl.getAttribLocation( program, "vColor" );
    //gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    //gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    matrixLoc = gl.getUniformLocation( program, "rotation" );
	normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

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
	
	gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"), materialShininess );
	
    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices
    
    //vertex color assigned by the index of the vertex
    
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );
    
        // for solid colored faces use 
        colors.push(vertexColors[0]);
        
    }
}


function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var ctm = mat4();
    ctm = mult( ctm, rotateX(spinX) );
    ctm = mult( ctm, rotateY(spinY) ) ;
	
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(ctm) );

	// normal matrix only really need if there is nonuniform scaling
    // it's here for generality but since there is
    // no scaling in this example we could just use modelView matrix in shaders
    normalMatrix = [
        vec3(ctm[0][0], ctm[0][1], ctm[0][2]),
        vec3(ctm[1][0], ctm[1][1], ctm[1][2]),
        vec3(ctm[2][0], ctm[2][1], ctm[2][2])
    ];
	normalMatrix.matrix = true;
            
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(ctm) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );

    // Sm��a kollinn
    // Fyrst eru f�turnir..
    ctm1 = mult( ctm, translate( -0.4, 0.0, -0.3 ) );
    ctm1 = mult( ctm1, scalem( 0.07, 0.5, 0.07 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm1));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    ctm1 = mult( ctm, translate( -0.4, 0.0, 0.3 ) );
    ctm1 = mult( ctm1, scalem( 0.07, 0.5, 0.07 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm1));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    ctm1 = mult( ctm, translate( 0.4, 0.0, 0.3 ) );
    ctm1 = mult( ctm1, scalem( 0.07, 0.5, 0.07 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm1));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    ctm1 = mult( ctm, translate( 0.4, 0.0, -0.3 ) );
    ctm1 = mult( ctm1, scalem( 0.07, 0.5, 0.07 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm1));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    // Svo toppurinn � kollinum
    ctm1 = mult( ctm, translate( 0.0, 0.325, 0.0 ) );
    ctm1 = mult( ctm1, scalem( 0.9, 0.2, 0.7 ) );
    gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm1));
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    requestAnimFrame( render );
}

