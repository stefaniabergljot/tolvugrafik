/////////////////////////////////////////////////////////////////
//    Heimadæmi 3-5 í Tölvugrafík
//     Ferningur skoppar um gluggann, 
//     og skoppar af hreyfanlegum spaða.
//     Byggt á box-bounce og spadi
//
//    Stefanía Bergljót Stefánsdóttir, september 2023
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Núverandi staðsetning miðju ferningsins
var box = vec2( 0.0, 0.0 );
// Núverandi staðsetning miðju sleðans
var slide = vec2(0.0, 0.0);

// Stefna (og hraði) fernings
var dX;
var dY;

// Svæðið er frá -maxX til maxX og -maxY til maxY
var maxX = 1.0;
var maxY = 1.0;

// Hálf breidd/hæð ferningsins
var boxRad = 0.05;

// Ferningurinn er upphaflega í miðjunni
//var vertices = new Float32Array([-0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05]);
var vertices = new Float32Array([-0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05,
                                 -0.1, -0.9, -0.1, -0.86, 0.1, -0.86, 0.1, -0.9]);

var mouseX;             // Old value of x-coordinate  
var movement = false;   // Do we move the paddle?

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    
    // Gefa ferningnum slembistefnu í upphafi
    dX = Math.random()*0.1-0.05;
    dY = Math.random()*0.1-0.05;

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.DYNAMIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locBox = gl.getUniformLocation( program, "boxPos" );

    // Meðhöndlun örvalykla
    window.addEventListener("keydown", function(e){
        switch( e.keyCode ) {
            case 38:	// upp ör
                dX *= 1.1;
                dY *= 1.1;
                break;
            case 40:	// niður ör
                dX /= 1.1;
                dY /= 1.1;
                break;
        }
    } );
    
    // Hlustarar fyrir sleðann: 
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        mouseX = e.offsetX;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            var xmove = 2*(e.offsetX - mouseX)/canvas.width;
            mouseX = e.offsetX;
            slide[0] += xmove;
        }
    } );

    render();
}


function render() {
    var slideHeight = vertices[11];
    var slideRight = vertices[12] + slide[0];
    var slideLeft = vertices[8] + slide[0];
    
    // Láta ferninginn skoppa af veggjunum
    if (Math.abs(box[0] + dX) > maxX - boxRad) dX = -dX;
    if (Math.abs(box[1] + dY) > maxY - boxRad) dY = -dY;
    
    // Láta ferninginn skoppa af sleðanum
    if (box[1]+dY - boxRad < slideHeight) {
        if (box[0]+boxRad + dX > slideLeft && box[0]-boxRad + dX < slideRight) {
            // We have a collision
            dX = -dX;
            dY = -dY;
        }
    }

    // Uppfæra staðsetningu
    box[0] += dX;
    box[1] += dY;
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    gl.uniform2fv( locBox, flatten(box) );

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
    
    gl.uniform2fv( locBox, flatten(slide));
    
    gl.drawArrays( gl.TRIANGLE_FAN, 4, 4 );

    window.requestAnimFrame(render);
}
