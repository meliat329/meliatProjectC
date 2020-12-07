//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// TABS set to 2.
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// JT_MultiShader.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

// Jack Tumblin's Project C -- step by step.

/* Show how to use 3 separate VBOs with different verts, attributes & uniforms. 
-------------------------------------------------------------------------------
    Create a 'VBObox' object/class/prototype & library to collect, hold & use all 
    data and functions we need to render a set of vertices kept in one Vertex 
    Buffer Object (VBO) on-screen, including:
    --All source code for all Vertex Shader(s) and Fragment shader(s) we may use 
        to render the vertices stored in this VBO;
    --all variables needed to select and access this object's VBO, shaders, 
        uniforms, attributes, samplers, texture buffers, and any misc. items. 
    --all variables that hold values (uniforms, vertex arrays, element arrays) we 
      will transfer to the GPU to enable it to render the vertices in our VBO.
    --all user functions: init(), draw(), adjust(), reload(), empty(), restore().
    Put all of it into 'JT_VBObox-Lib.js', a separate library file.

USAGE:
------
1) If your program needs another shader program, make another VBObox object:
 (e.g. an easy vertex & fragment shader program for drawing a ground-plane grid; 
 a fancier shader program for drawing Gouraud-shaded, Phong-lit surfaces, 
 another shader program for drawing Phong-shaded, Phong-lit surfaces, and
 a shader program for multi-textured bump-mapped Phong-shaded & lit surfaces...)
 
 HOW:
 a) COPY CODE: create a new VBObox object by renaming a copy of an existing 
 VBObox object already given to you in the VBObox-Lib.js file. 
 (e.g. copy VBObox1 code to make a VBObox3 object).

 b) CREATE YOUR NEW, GLOBAL VBObox object.  
 For simplicity, make it a global variable. As you only have ONE of these 
 objects, its global scope is unlikely to cause confusions/errors, and you can
 avoid its too-frequent use as a function argument.
 (e.g. above main(), write:    var phongBox = new VBObox3();  )

 c) INITIALIZE: in your JS progam's main() function, initialize your new VBObox;
 (e.g. inside main(), write:  phongBox.init(); )

 d) DRAW: in the JS function that performs all your webGL-drawing tasks, draw
 your new VBObox's contents on-screen. 
 (NOTE: as it's a COPY of an earlier VBObox, your new VBObox's on-screen results
  should duplicate the initial drawing made by the VBObox you copied.  
  If that earlier drawing begins with the exact same initial position and makes 
  the exact same animated moves, then it will hide your new VBObox's drawings!
  --THUS-- be sure to comment out the earlier VBObox's draw() function call  
  to see the draw() result of your new VBObox on-screen).
  (e.g. inside drawAll(), add this:  
      phongBox.switchToMe();
      phongBox.draw();            )

 e) ADJUST: Inside the JS function that animates your webGL drawing by adjusting
 uniforms (updates to ModelMatrix, etc) call the 'adjust' function for each of your
VBOboxes.  Move all the uniform-adjusting operations from that JS function into the
'adjust()' functions for each VBObox. 

2) Customize the VBObox contents; add vertices, add attributes, add uniforms.
 ==============================================================================*/


// Global Variables  
//   (These are almost always a BAD IDEA, but here they eliminate lots of
//    tedious function arguments. 
//    Later, collect them into just a few global, well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

//camera and movement vectors
var e = [-12, 0, 2, 1]; //camera position vector
var l = [-11, 0, 2, 1]; //lookat point vector
var u = [0, 0, 1, 0]; //up vector

var d = .1; //distance/velocity for movement 
//var t = 0.01; // change for theta
var theta = 0; //horizontal angle

// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0();		  // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
diffuseBox = new VBObox1();		  // "  "  for first set of custom-shaded 3D parts
gouraudPhongBox = new VBObox2();     // "  "  for second set of custom-shaded 3D parts
phongPhongBox = new VBObox3();
gouraudBPhongBox = new VBObox4();
phongBPhongBox = new VBObox5();


// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our 
// most-recently-drawn WebGL screen contents.  
// Set & used by moveAll() fcn to update all
// time-varying params for our webGL drawings.
// All time-dependent params (you can add more!)
var g_angleNow0 = 0.0; 			  // Current rotation angle, in degrees.
var g_angleRate0 = 45.0;				// Rotation angle rate, in degrees/second.
//---------------
var g_angleNow1 = 100.0;       // current angle, in degrees
var g_angleRate1 = 45.0;        // rotation angle rate, degrees/sec
var g_angleMax1 = 30.0;       // max, min allowed angle, in degrees
var g_angleMin1 = -10.0;
//---------------
var g_angleNow2 = 0.0; 			  // Current rotation angle, in degrees.
var g_angleRate2 = -62.0;				// Rotation angle rate, in degrees/second.

//---------------
var g_posNow0 = 0.0;           // current position
var g_posRate0 = 0.6;           // position change rate, in distance/second.
var g_posMax0 = 0.5;           // max, min allowed for g_posNow;
var g_posMin0 = -0.5;
// ------------------
var g_posNow1 = 0.0;           // current position
var g_posRate1 = 0.5;           // position change rate, in distance/second.
var g_posMax1 = 1.0;           // max, min allowed positions
var g_posMin1 = -1.0;
//---------------

// For mouse/keyboard:------------------------
var g_show0 = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.
var g_show1 = 1;								// 	"					"			VBO1		"				"				" 
var g_show2 = 0;                //  "         "     VBO2    "       "       "
var g_show3 = 0;
var g_show4 = 0;
var g_show5 = 0;

// GLOBAL CAMERA CONTROL:					// 
g_worldMat = new Matrix4();				// Changes CVV drawing axes to 'world' axes.
// (equivalently: transforms 'world' coord. numbers (x,y,z,w) to CVV coord. numbers)
// WHY?
// Lets mouse/keyboard functions set just one global matrix for 'view' and 
// 'projection' transforms; then VBObox objects use it in their 'adjust()'
// member functions to ensure every VBObox draws its 3D parts and assemblies
// using the same 3D camera at the same 3D position in the same 3D world).

//phong materials
//phong materials
// var matl0 = new Material(MATL_CHROME);
// var matl1 = new Material(MATL_RED_PLASTIC);
// var matl2 = new Material(MATL_PEWTER);

// var uLoc_Ke = false;
// var uLoc_Ka = false;
// var uLoc_Kd = false;
// var uLoc_Kd2 = false;			// for K_d within the MatlSet[0] element.l
// var uLoc_Ks = false;
// var uLoc_Kshiny = false;

function main() {
    //=============================================================================
    // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
    g_canvasID = document.getElementById('webgl');
    // Create the the WebGL rendering context: one giant JavaScript object that
    // contains the WebGL state machine adjusted by large sets of WebGL functions,
    // built-in variables & parameters, and member data. Every WebGL function call
    // will follow this format:  gl.WebGLfunctionName(args);

    // Create the the WebGL rendering context: one giant JavaScript object that
    // contains the WebGL state machine, adjusted by big sets of WebGL functions,
    // built-in variables & parameters, and member data. Every WebGL func. call
    // will follow this format:  gl.WebGLfunctionName(args);
    //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID); 
    // Here's a BETTER version:
    gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true });
    window.addEventListener("keydown", myKeyDown, false);
    window.addEventListener("keyup", myKeyUp, false);
    // This fancier-looking version disables HTML-5's default screen-clearing, so 
    // that our drawMain() 
    // function will over-write previous on-screen results until we call the 
    // gl.clear(COLOR_BUFFER_BIT); function. )
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }



    gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>

    gl.enable(gl.DEPTH_TEST);

    /*
  //----------------SOLVE THE 'REVERSED DEPTH' PROBLEM:------------------------
    // IF the GPU doesn't transform our vertices by a 3D Camera Projection Matrix
    // (and it doesn't -- not until Project B) then the GPU will compute reversed 
    // depth values:  depth==0 for vertex z == -1;   (but depth = 0 means 'near') 
    //		    depth==1 for vertex z == +1.   (and depth = 1 means 'far').
    //
    // To correct the 'REVERSED DEPTH' problem, we could:
    //  a) reverse the sign of z before we render it (e.g. scale(1,1,-1); ugh.)
    //  b) reverse the usage of the depth-buffer's stored values, like this:
    gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
  
    gl.clearDepth(0.0);       // each time we 'clear' our depth buffer, set all
                              // pixel depths to 0.0  (1.0 is DEFAULT)
    gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is GREATER
                              // than the depth buffer's stored value.
                              // (gl.LESS is DEFAULT; reverse it!)
    //------------------end 'REVERSED DEPTH' fix---------------------------------
  */

    // Initialize each of our 'vboBox' objects: 
    worldBox.init(gl);		// VBO + shaders + uniforms + attribs for our 3D world,
    // including ground-plane,                       
    diffuseBox.init(gl);		//  "		"		"  for 1st kind of shading & lighting
    gouraudPhongBox.init(gl);    //  "   "   "  for 2nd kind of shading & lighting
    phongPhongBox.init(gl);
    gouraudBPhongBox.init(gl);
    phongBPhongBox.init(gl);

    setCamera();				// TEMPORARY: set a global camera used by ALL VBObox objects...

    gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>

    // // ... for Phong material/reflectance:
    // uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
    // console.log('uLoc_Ke', uLoc_Ke, '\n');
    // uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
    // uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
    // uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
    // uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');

    // if (!uLoc_Ke || !uLoc_Ka || !uLoc_Kd // || !uLoc_Kd2
    //     || !uLoc_Ks || !uLoc_Kshiny
    // ) {
    //     console.log('Failed to get GPUs Reflectance storage locations');
    //     return;
    // }

    // // TEST: can we store/retrieve these locations in our matl0 object?
    // // try one:
    // matl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
    // console.log('matl0.uLoc_Ke', matl0.uLoc_Ke);
    // /*	uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
    //     uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
    //     uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
    //     uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
    // */
    // if (!matl0.uLoc_Ke
    //     //  || !matl0.uLoc_Ka || !matl0.uLoc_Kd // || !uLoc_Kd2
    //     //	  		    || !matl0.uLoc_Ks || !matl0.uLoc_Kshiny
    // ) {
    //     console.log('Failed to get GPUs Reflectance NEW storage locations');
    //     return;
    // }

    // ==============ANIMATION=============
    // Quick tutorials on synchronous, real-time animation in JavaScript/HTML-5: 
    //    https://webglfundamentals.org/webgl/lessons/webgl-animation.html
    //  or
    //  	http://creativejs.com/resources/requestanimationframe/
    //		--------------------------------------------------------
    // Why use 'requestAnimationFrame()' instead of the simpler-to-use
    //	fixed-time setInterval() or setTimeout() functions?  Because:
    //		1) it draws the next animation frame 'at the next opportunity' instead 
    //			of a fixed time interval. It allows your browser and operating system
    //			to manage its own processes, power, & computing loads, and to respond 
    //			to on-screen window placement (to skip battery-draining animation in 
    //			any window that was hidden behind others, or was scrolled off-screen)
    //		2) it helps your program avoid 'stuttering' or 'jittery' animation
    //			due to delayed or 'missed' frames.  Your program can read and respond 
    //			to the ACTUAL time interval between displayed frames instead of fixed
    //		 	fixed-time 'setInterval()' calls that may take longer than expected.
    //------------------------------------
    var tick = function () {		    // locally (within main() only), define our 
        // self-calling animation function. 
        requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
        // til browser is ready to re-draw canvas, then
        timerAll();  // Update all time-varying params, and
        drawAll();                // Draw all the VBObox contents
    };
    //------------------------------------
    tick();                       // do it again!
}

function timerAll() {
    //=============================================================================
    // Find new values for all time-varying parameters used for on-screen drawing
    // use local variables to find the elapsed time.
    var nowMS = Date.now();             // current time (in milliseconds)
    var elapsedMS = nowMS - g_lastMS;   // 
    g_lastMS = nowMS;                   // update for next webGL drawing.
    if (elapsedMS > 1000.0) {
        // Browsers won't re-draw 'canvas' element that isn't visible on-screen 
        // (user chose a different browser tab, etc.); when users make the browser
        // window visible again our resulting 'elapsedMS' value has gotten HUGE.
        // Instead of allowing a HUGE change in all our time-dependent parameters,
        // let's pretend that only a nominal 1/30th second passed:
        elapsedMS = 1000.0 / 30.0;
    }
    // Find new time-dependent parameters using the current or elapsed time:
    // Continuous rotation:
    g_angleNow0 = g_angleNow0 + (g_angleRate0 * elapsedMS) / 1000.0;
    g_angleNow1 = g_angleNow1 + (g_angleRate1 * elapsedMS) / 1000.0;
    g_angleNow2 = g_angleNow2 + (g_angleRate2 * elapsedMS) / 1000.0;
    g_angleNow0 %= 360.0;   // keep angle >=0.0 and <360.0 degrees  
    g_angleNow1 %= 360.0;
    g_angleNow2 %= 360.0;
    if (g_angleNow1 > g_angleMax1) { // above the max?
        g_angleNow1 = g_angleMax1;    // move back down to the max, and
        g_angleRate1 = -g_angleRate1; // reverse direction of change.
    }
    else if (g_angleNow1 < g_angleMin1) {  // below the min?
        g_angleNow1 = g_angleMin1;    // move back up to the min, and
        g_angleRate1 = -g_angleRate1;
    }
    // Continuous movement:
    g_posNow0 += g_posRate0 * elapsedMS / 1000.0;
    g_posNow1 += g_posRate1 * elapsedMS / 1000.0;
    // apply position limits
    if (g_posNow0 > g_posMax0) {   // above the max?
        g_posNow0 = g_posMax0;      // move back down to the max, and
        g_posRate0 = -g_posRate0;   // reverse direction of change
    }
    else if (g_posNow0 < g_posMin0) {  // or below the min? 
        g_posNow0 = g_posMin0;      // move back up to the min, and
        g_posRate0 = -g_posRate0;   // reverse direction of change.
    }
    if (g_posNow1 > g_posMax1) {   // above the max?
        g_posNow1 = g_posMax1;      // move back down to the max, and
        g_posRate1 = -g_posRate1;   // reverse direction of change
    }
    else if (g_posNow1 < g_posMin1) {  // or below the min? 
        g_posNow1 = g_posMin1;      // move back up to the min, and
        g_posRate1 = -g_posRate1;   // reverse direction of change.
    }

}


function drawAll() {
    //=============================================================================
    // Clear on-screen HTML-5 <canvas> object:
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var b4Draw = Date.now();
    var b4Wait = b4Draw - g_lastMS;
    resize(gl.canvas);
    setCamera();

    if (g_show0 == 1) {	// IF user didn't press HTML button to 'hide' VBO0:
        worldBox.switchToMe();  // Set WebGL to render from this VBObox.
        worldBox.adjust();		  // Send new values for uniforms to the GPU, and
        worldBox.draw();			  // draw our VBO's contents using our shaders.
    }
    if (g_show1 == 1) { // IF user didn't press HTML button to 'hide' VBO1:
        diffuseBox.switchToMe();  // Set WebGL to render from this VBObox.
        diffuseBox.adjust();		  // Send new values for uniforms to the GPU, and
        diffuseBox.draw();			  // draw our VBO's contents using our shaders.
    }

    if (g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
        gouraudPhongBox.switchToMe();  // Set WebGL to render from this VBObox.
        gouraudPhongBox.adjust();		  // Send new values for uniforms to the GPU, and
        gouraudPhongBox.draw();			  // draw our VBO's contents using our shaders.
    }
    if (g_show3 == 1) { // IF user didn't press HTML button to 'hide' VBO3:
        phongPhongBox.switchToMe();  // Set WebGL to render from this VBObox.
        phongPhongBox.adjust();		  // Send new values for uniforms to the GPU, and
        phongPhongBox.draw();			  // draw our VBO's contents using our shaders.
    }
    if (g_show4 == 1) {
        gouraudBPhongBox.switchToMe();  // Set WebGL to render from this VBObox.
        gouraudBPhongBox.adjust();		  // Send new values for uniforms to the GPU, and
        gouraudBPhongBox.draw();
    }
    if (g_show5 == 1) {
        phongBPhongBox.switchToMe();  // Set WebGL to render from this VBObox.
        phongBPhongBox.adjust();		  // Send new values for uniforms to the GPU, and
        phongBPhongBox.draw();
    }
    /* // ?How slow is our own code?  	
    var aftrDraw = Date.now();
    var drawWait = aftrDraw - b4Draw;
    console.log("wait b4 draw: ", b4Wait, "drawWait: ", drawWait, "mSec");
    */
}

function VBO0toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO0'.
    if (g_show0 != 1) g_show0 = 1;				// show,
    else g_show0 = 0;										// hide.
    console.log('g_show0: ' + g_show0);
}

function VBO1toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO1'.
    if (g_show1 != 1) {
        g_show1 = 1;
        g_show2 = 0;
        g_show3 = 0;
        g_show4 = 0;
        g_show5 = 0;
    }			// show,
    console.log('g_show1: ' + g_show1);
}

function VBO2toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO2'.
    if (g_show2 != 1) {
        g_show2 = 1;
        g_show1 = 0;
        g_show3 = 0;
        g_show4 = 0;
        g_show5 = 0;
    }			// show,
    console.log('g_show2: ' + g_show2);
}

function VBO3toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO2'.
    if (g_show3 != 1) {
        g_show3 = 1;
        g_show1 = 0;
        g_show2 = 0;
        g_show4 = 0;
        g_show5 = 0;
        var matbutton = document.getElementById("matbutton");
        matbutton.style.visibility = 'visible';
    }			// show,
    console.log('g_show3: ' + g_show3);
}

function VBO4toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO2'.
    if (g_show4 != 1) {
        g_show4 = 1;
        g_show1 = 0;
        g_show2 = 0;
        g_show5 = 0;
        g_show3 = 0;
    }			// show,
    console.log('g_show4: ' + g_show4);
}

function VBO5toggle() {
    //=============================================================================
    // Called when user presses HTML-5 button 'Show/Hide VBO2'.
    if (g_show5 != 1) {
        g_show5 = 1;
        g_show1 = 0;
        g_show2 = 0;
        g_show4 = 0;
        g_show3 = 0;
        var matbutton = document.getElementById("matbutton");
        matbutton.style.visibility = 'visible';
    }			// show,
    console.log('g_show5: ' + g_show5);
}

/**
 * gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelMatrix.setIdentity();    // DEFINE 'world-space' coords.


    const aspect = effectiveWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 50.0;

    const perspectiveProjectionMatrix =
        modelMatrix.perspective(40.0, aspect, near, far);


    const cameraMatrix = modelMatrix.lookAt(e[0], e[1], e[2],	// center of projection
        l[0], l[1], l[2],	// look-at point 
        u[0], u[1], u[2]);	// View UP vector.

    drawScene(perspectiveProjectionMatrix);
 */

function setCamera() {
    //============================================================================
    // PLACEHOLDER:  sets a fixed camera at a fixed position for use by
    // ALL VBObox objects.  REPLACE This with your own camera-control code.

    g_worldMat.setIdentity();
    const width = gl.canvas.width;
    const height = gl.canvas.height;
    gl.viewport(0, 0, width, height)

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 200.0;



    g_worldMat.perspective(30.0,   // FOVY: top-to-bottom vertical image angle, in degrees
        aspect,   // Image Aspect Ratio: camera lens width/height
        near,   // camera z-near distance (always positive; frustum begins at z = -znear)
        far);  // camera z-far distance (always positive; frustum ends at z = -zfar)

    g_worldMat.lookAt(e[0], e[1], e[2],	// center of projection
        l[0], l[1], l[2],	// look-at point 
        u[0], u[1], u[2]);	// View UP vector.
    // READY to draw in the 'world' coordinate system.
    //------------END COPY

}


function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth = window.innerWidth;
    var displayHeight = 0.7 * window.innerHeight;

    // Check if the canvas is not the same size.
    if (canvas.width != displayWidth ||
        canvas.height != displayHeight) {

        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

function myKeyDown(kev) {
    //===============================================================================
    // Called when user presses down ANY key on the keyboard;
    //
    // For a light, easy explanation of keyboard events in JavaScript,
    // see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
    // For a thorough explanation of a mess of JavaScript keyboard event handling,
    // see:    http://javascript.info/tutorial/keyboard-events
    //
    // NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
    //        'keydown' event deprecated several read-only properties I used
    //        previously, including kev.charCode, kev.keyCode. 
    //        Revised 2/2019:  use kev.key and kev.code instead.
    //
    // Report EVERYTHING in console:
    console.log("--kev.code:", kev.code, "\t\t--kev.key:", kev.key,
        "\n--kev.ctrlKey:", kev.ctrlKey, "\t--kev.shiftKey:", kev.shiftKey,
        "\n--kev.altKey:", kev.altKey, "\t--kev.metaKey:", kev.metaKey);

    // and report EVERYTHING on webpage:
    document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
    document.getElementById('KeyModResult').innerHTML = '';

    switch (kev.code) {
        //------------------WASD navigation-----------------
        case "KeyS":
            console.log("S Key\n");
            document.getElementById('KeyDownResult').innerHTML =
                'S key';
            //moves lookat up
            var d_x = l[0] - e[0];
            var d_y = l[1] - e[1];
            var d_z = l[2] - e[2];
            e[0] = e[0] - (d_x * d);
            l[0] = l[0] - (d_x * d);
            e[1] = e[1] - (d_y * d);
            l[1] = l[1] - (d_y * d);
            e[2] = e[2] - (d_z * d);
            l[2] = l[2] - (d_z * d);
            break;
        case "KeyW":
            console.log("W Key\n");
            document.getElementById('KeyDownResult').innerHTML =
                'W key';
            //moves lookat down
            var d_x = l[0] - e[0];
            var d_y = l[1] - e[1];
            var d_z = l[2] - e[2];
            e[0] = e[0] + (d_x * d);
            l[0] = l[0] + (d_x * d);
            e[1] = e[1] + (d_y * d);
            l[1] = l[1] + (d_y * d);
            e[2] = e[2] + (d_z * d);
            l[2] = l[2] + (d_z * d);
            break;
        case "KeyA":
            console.log("A Key\n");
            document.getElementById('KeyDownResult').innerHTML =
                'A key';
            //rotates lookat left
            var d_x = -1 * (l[1] - e[1]);
            var d_y = l[0] - e[0];
            e[1] = e[1] + (d_y * d);
            l[1] = l[1] + (d_y * d);
            e[0] = e[0] + (d_x * d);
            l[0] = l[0] + (d_x * d);
            break;
        case "KeyD":
            console.log("D Key\n");
            document.getElementById('KeyDownResult').innerHTML =
                'D key';
            //rotates lookat right
            var d_x = -1 * (l[1] - e[1]);
            var d_y = (l[0] - e[0]);
            e[1] = e[1] - (d_y * d);
            l[1] = l[1] - (d_y * d);
            e[0] = e[0] - (d_x * d);
            l[0] = l[0] - (d_x * d);
            break;
        //----------------Arrow keys------------------------
        case "ArrowUp":
            console.log('Up-Arrow Key');
            document.getElementById('KeyDownResult').innerHTML =
                'Up-Arrow Key';
            //moves camera towards lookat
            l[2] = l[2] + d;

            break;
        case "ArrowDown":
            console.log('Down-Arrow Key');
            document.getElementById('KeyDownResult').innerHTML =
                'Down-Arrow Key';
            //moves camera away from lookat
            l[2] = l[2] - d;
            break;
        case "ArrowRight":
            console.log('Right-Arrow Key');
            document.getElementById('KeyDownResult').innerHTML =
                'Right-Arrow Key';
            //moves camera right
            theta -= d;
            l[0] = e[0] + Math.cos(theta);
            l[1] = e[1] + Math.sin(theta);
            break;
        case "ArrowLeft":
            console.log('Left-Arrow Key');
            document.getElementById('KeyDownResult').innerHTML =
                'Left-Arrow Key';
            //moves camera left
            theta += d;
            l[0] = e[0] + Math.cos(theta);
            l[1] = e[1] + Math.sin(theta);
            break;
        //------------------Other Keys-----------------------
        case "ShiftLeft":
            console.log('Shift Key');
            document.getElementById('KeyDownResult').innerHTML =
                'Shift Key';
            //moves camera down
            e[2] = e[2] - d;
            l[2] = l[2] - d;
            break;
        case "ShiftRight":
            console.log('Shift Key');
            document.getElementById('KeyDownResult').innerHTML =
                'Shift Key';
            //moves camera down
            e[2] = e[2] - d;
            l[2] = l[2] - d;
            break;
        case "Space":
            console.log('Spacebar');
            document.getElementById('KeyDownResult').innerHTML =
                'Spacebar';
            //moves camera up
            e[2] = e[2] + d;
            l[2] = l[2] + d;
            break;
        case "KeyM":	// UPPER-case 'M' key:
            console.log('KeyM');
            document.getElementById('KeyDownResult').innerHTML =
                'M Key';
            if (g_show5 == 1) {
                matl0 = (matl0 + 1) % MATL_DEFAULT;	// see materials_Ayerdi.js for list
                myMatl.setMatl(matl0);								// set new material reflectances,
                draw();
            }
            if (g_show3 == 1) {
                matl1 = (matl1 + 1) % MATL_DEFAULT;
                myMatl0.setMatl(matl1);
                draw();
            }													// re-draw on-screen image.
            break;
        //-------------------Default-----------------------------
        default:
            console.log("Invalid Input");
            document.getElementById('KeyDownResult').innerHTML =
                'Invalid Input';
            break;
    }
}

function myKeyUp(kev) {
    //===============================================================================
    // Called when user releases ANY key on the keyboard; captures scancodes well

    console.log('myKeyUp()--keyCode=' + kev.keyCode + ' released.');
}

//Prevents arrow keys from scrolling page
var keys = {};
window.addEventListener("keydown",
    function (e) {
        keys[e.keyCode] = true;
        switch (e.keyCode) {
            case 37: case 39: case 38: case 40: // Arrow keys
            case 32: e.preventDefault(); break; // Space
            default: break; // do not block other keys
        }
    },
    false);
window.addEventListener('keyup',
    function (e) {
        keys[e.keyCode] = false;
    },
    false);

///////////AR slider///////////////////////////////////////////////////////
var sliderAR = document.getElementById("AR");
var outputAR = document.getElementById("oAR");
outputAR.innerHTML = sliderAR.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderAR.oninput = function () {
    outputAR.innerHTML = this.value;
}

///////////AG slider///////////////////////////////////////////////////////
var sliderAG = document.getElementById("AG");
var outputAG = document.getElementById("oAG");
outputAG.innerHTML = sliderAG.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderAG.oninput = function () {
    outputAG.innerHTML = this.value;
}

///////////AB slider///////////////////////////////////////////////////////
var sliderAB = document.getElementById("AB");
var outputAB = document.getElementById("oAB");
outputAB.innerHTML = sliderAB.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderAB.oninput = function () {
    outputAB.innerHTML = this.value;
}

///////////DR slider///////////////////////////////////////////////////////
var sliderDR = document.getElementById("DR");
var outputDR = document.getElementById("oDR");
outputDR.innerHTML = sliderDR.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderDR.oninput = function () {
    outputDR.innerHTML = this.value;
}

///////////DG slider///////////////////////////////////////////////////////
var sliderDG = document.getElementById("DG");
var outputDG = document.getElementById("oDG");
outputDG.innerHTML = sliderDG.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderDG.oninput = function () {
    outputDG.innerHTML = this.value;
}

///////////DB slider///////////////////////////////////////////////////////
var sliderDB = document.getElementById("DB");
var outputDB = document.getElementById("oDB");
outputDB.innerHTML = sliderDB.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderDB.oninput = function () {
    outputDB.innerHTML = this.value;
}

///////////SR slider///////////////////////////////////////////////////////
var sliderSR = document.getElementById("SR");
var outputSR = document.getElementById("oSR");
outputSR.innerHTML = sliderSR.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderSR.oninput = function () {
    outputSR.innerHTML = this.value;
}

///////////SG slider///////////////////////////////////////////////////////
var sliderSG = document.getElementById("SG");
var outputSG = document.getElementById("oSG");
outputSG.innerHTML = sliderSG.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderSG.oninput = function () {
    outputSG.innerHTML = this.value;
}

///////////SB slider///////////////////////////////////////////////////////
var sliderSB = document.getElementById("SB");
var outputSB = document.getElementById("oSB");
outputSB.innerHTML = sliderSB.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderSB.oninput = function () {
    outputSB.innerHTML = this.value;
}

///////////X slider///////////////////////////////////////////////////////
var sliderX = document.getElementById("X");
var outputX = document.getElementById("oX");
outputX.innerHTML = sliderX.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderX.oninput = function () {
    outputX.innerHTML = this.value;
}

///////////Y slider///////////////////////////////////////////////////////
var sliderY = document.getElementById("Y");
var outputY = document.getElementById("oY");
outputY.innerHTML = sliderY.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderY.oninput = function () {
    outputY.innerHTML = this.value;
}

///////////Z slider///////////////////////////////////////////////////////
var sliderZ = document.getElementById("Z");
var outputZ = document.getElementById("oZ");
outputZ.innerHTML = sliderZ.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
sliderZ.oninput = function () {
    outputZ.innerHTML = this.value;
}