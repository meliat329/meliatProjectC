//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
        the same attributes (e.g. position, color, surface normal), and use 
        the same shader program (e.g. same Vertex Shader and Fragment Shader), 
        then our textbook's simple 'example code' will suffice.
          
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
        different sets of vertices with  different sets of attributes rendered 
        by different shader programs.  THUS a customized VBObox object for each 
        VBO/shader-program pair will help you remember and correctly implement ALL 
        the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
    	
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
        set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
        as drawn by calls to one 'shader program' that runs on your computer's 
        Graphical Processing Unit(GPU), along with changes to values of that shader 
        program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
        in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
        Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
        'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
        Shader for each vertex in every shape, and one 'instance' of the Fragment 
        Shader for every on-screen pixel covered by any part of any drawing 
        primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
        accessed by the shader program through its 'attribute' variables. Shader's
        'uniform' variable values also get retrieved from GPU memory, but their 
        values can't be changed while the shader program runs.  
        Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
        its 'adjust()'	function computes newly-updated values for these uniform 
        vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
        This vector/matrix library is more complete, more widely-used, and runs
        faster than our textbook's 'cuon-matrix-quat03.js' library.  
        --------------------------------------------------------------
        I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
        --------------------------------------------------------------
        for all future WebGL programs. 
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very 
    gradual, sensible, testable way:
        --add the glmatrix.js library to an existing cuon-matrix-based program;
            (but don't call any of its functions yet).
        --comment out the glmatrix.js parts (if any) that cause conflicts or in	
            any way disrupt the operation of your program.
        --make just one small local change in your program; find a small, simple,
            easy-to-test portion of your program where you can replace a 
            cuon-matrix object or function call with a glmatrix function call.
            Test; make sure it works. Don't make too large a change: it's hard to fix!
        --Save a copy of this new program as your latest numbered version. Repeat
            the previous step: go on to the next small local change in your program
            and make another replacement of cuon-matrix use with glmatrix use. 
            Test it; make sure it works; save this as your next numbered version.
        --Continue this process until your program no longer uses any cuon-matrix
            library features at all, and no part of glmatrix is commented out.
            Remove cuon-matrix from your library, and now use only glmatrix.

    ------------------------------------------------------------------
    VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
    ------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
        I don't see any easy way to use the exact same object constructors and 
        prototypes for all VBObox objects.  Every additional VBObox objects may vary 
        substantially, so I recommend that you copy and re-name an existing VBObox 
        prototype object, and modify as needed, as shown here. 
        (e.g. to make the VBObox3 object, copy the VBObox2 constructor and 
        all its prototype functions, then modify their contents for VBObox3 
        activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================
var matl0 = MATL_RED_PLASTIC;
var matl1 = MATL_PEWTER;

var myMatl = new Material(MATL_RED_PLASTIC);
var myMatl0 = new Material(MATL_PEWTER);


var floatsPerVertex = 7;
function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax = 50.0;			// grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
    var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.

    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1);		// HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1);		// (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {	// put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j] = -xymax + (v) * xgap;	// x
            gndVerts[j + 1] = -xymax;								// y
            gndVerts[j + 2] = 0.0;									// z
            gndVerts[j + 3] = 1.0;									// w.
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j] = -xymax + (v - 1) * xgap;	// x
            gndVerts[j + 1] = xymax;								// y
            gndVerts[j + 2] = 0.0;									// z
            gndVerts[j + 3] = 1.0;									// w.
        }
        gndVerts[j + 4] = xColr[0];			// red
        gndVerts[j + 5] = xColr[1];			// grn
        gndVerts[j + 6] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
        if (v % 2 == 0) {		// put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j] = -xymax;								// x
            gndVerts[j + 1] = -xymax + (v) * ygap;	// y
            gndVerts[j + 2] = 0.0;									// z
            gndVerts[j + 3] = 1.0;									// w.
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j] = xymax;								// x
            gndVerts[j + 1] = -xymax + (v - 1) * ygap;	// y
            gndVerts[j + 2] = 0.0;									// z
            gndVerts[j + 3] = 1.0;									// w.
        }
        gndVerts[j + 4] = yColr[0];			// red
        gndVerts[j + 5] = yColr[1];			// grn
        gndVerts[j + 6] = yColr[2];			// blu
    }
}
//=============================================================================
//=============================================================================
function VBObox0() {
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.

    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!

    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
        //
        'uniform mat4 u_ModelMat0;\n' +
        'attribute vec4 a_Pos0;\n' +
        'attribute vec3 a_Colr0;\n' +
        'varying vec3 v_Colr0;\n' +
        //
        'void main() {\n' +
        '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
        '	 v_Colr0 = a_Colr0;\n' +
        ' }\n';

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec3 v_Colr0;\n' +
        'void main() {\n' +
        '  gl_FragColor = vec4(v_Colr0, 1.0);\n' +
        '}\n';

    makeGroundGrid();
    this.vboContents = gndVerts;//---------------------------------------------------------
    /*new Float32Array ([						// Array of vertex attribute values we will
                                                                // transfer to GPU's vertex buffer object (VBO)
    // 1st triangle:
         0.0,	 0.0,	0.0, 1.0,		1.0, 1.0, 1.0, //1 vertex:pos x,y,z,w; color: r,g,b  X AXIS
     1.0,  0.0, 0.0, 1.0,		1.0, 0.0, 0.0,
     
         0.0,	 0.0,	0.0, 1.0,		1.0, 1.0, 1.0, // Y AXIS
     0.0,  1.0, 0.0, 1.0,		0.0, 1.0, 0.0,
     
         0.0,	 0.0,	0.0, 1.0,		1.0, 1.0, 1.0, // Z AXIS
     0.0,  0.0, 1.0, 1.0,		0.0, 0.2, 1.0,
     
     // 2 long lines of the ground grid:
         -100.0,   0.2,	0.0, 1.0,		1.0, 0.2, 0.0, // horiz line
      100.0,   0.2, 0.0, 1.0,		0.0, 0.2, 1.0,
          0.2,	-100.0,	0.0, 1.0,		0.0, 1.0, 0.0, // vert line
      0.2,   100.0, 0.0, 1.0,		1.0, 0.0, 1.0,
         ]);
*/
    this.vboVerts = gndVerts.length / floatsPerVertex;//10;						// # of vertices held in 'vboContents' array
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // total number of bytes stored in vboContents
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex. 

    //----------------------Attribute sizes
    this.vboFcount_a_Pos0 = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Pos0. (4: x,y,z,w values)
    this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
    console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
        this.vboFcount_a_Colr0) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets  
    this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
    // of 1st a_Pos0 attrib value in vboContents[]
    this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;
    // (4 floats * bytes/float) 
    // # of bytes from START of vbo to the START
    // of 1st a_Colr0 attrib value in vboContents[]
    //-----------------------GPU memory locations:
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
    this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

    //---------------------- Uniform locations &values in our shaders
    this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
}

VBObox0.prototype.init = function () {
    //=============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:---------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
    this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
    if (this.a_PosLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Pos0');
        return -1;	// error exit.
    }
    this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
    if (this.a_ColrLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Colr0');
        return -1;	// error exit.
    }

    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
    if (!this.u_ModelMatLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMat1 uniform');
        return;
    }
}

VBObox0.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.

    // a) select our shader program:
    gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  

    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
        this.vboLoc);			    // the ID# the GPU uses for our VBO.

    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
        this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,			// type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the 
        // number of bytes used to store one complete vertex.  If set 
        // to zero, the GPU gets attribute values sequentially from 
        // VBO, starting at 'Offset'.	
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Pos0);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (We start with position).
    gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Colr0);

    // --Enable this assignment of each of these attributes to its' VBO source:
    gl.enableVertexAttribArray(this.a_PosLoc);
    gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function () {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox0.prototype.adjust = function () {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,

    this.ModelMat.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ModelMat.set(g_worldMat);	// use our global, shared camera.
    // READY to draw in 'world' coord axes.

    //  this.ModelMat.rotate(g_angleNow0, 0, 0, 1);	  // rotate drawing axes,
    //  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
        false, 				// use matrix transpose instead?
        this.ModelMat.elements);	// send data from Javascript.
    // Adjust the attributes' stride and offset (if necessary)
    // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function () {
    //=============================================================================
    // Render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
        0, 								// location of 1st vertex to draw;
        this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function () {
    //=============================================================================
    // Over-write current values in the GPU inside our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox0.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

function makeSphere() {
    var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
    // (choose odd # or prime# to avoid accidental symmetry)
    var sliceVerts = 27;	// # of vertices around the top edge of the slice
    // (same number of vertices on bottom of slice, too)
    var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
    var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
    var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
    var sliceAngle = Math.PI / slices;	// lattitude angle spanned by one slice.

    // Create a (global) array to hold this sphere's vertices:
    sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
    // # of vertices * # of elements needed to store them. 
    // each slice requires 2*sliceVerts vertices except 1st and
    // last ones, which require only 2*sliceVerts-1.

    // Create dome-shaped top slice of sphere at z=+1
    // s counts slices; v counts vertices; 
    // j counts array elements (vertices * elements per vertex)
    var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;
    var j = 0;							// initialize our array index
    var isLast = 0;
    var isFirst = 1;
    for (s = 0; s < slices; s++) {	// for each slice of the sphere,
        // find sines & cosines for top and bottom of this slice
        if (s == 0) {
            isFirst = 1;	// skip 1st vertex of 1st slice.
            cos0 = 1.0; 	// initialize: start at north pole.
            sin0 = 0.0;
        }
        else {					// otherwise, new top edge == old bottom edge
            isFirst = 0;
            cos0 = cos1;
            sin0 = sin1;
        }								// & compute sine,cosine for new bottom edge.
        cos1 = Math.cos((s + 1) * sliceAngle);
        sin1 = Math.sin((s + 1) * sliceAngle);
        // go around the entire slice, generating TRIANGLE_STRIP verts
        // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
        if (s == slices - 1) isLast = 1;	// skip last vertex of last slice.
        for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
            if (v % 2 == 0) {				// put even# vertices at the the slice's top edge
                // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
                sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                sphVerts[j + 2] = cos0;
                sphVerts[j + 3] = 1.0;
            }
            else { 	// put odd# vertices around the slice's lower edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		// x
                sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);		// y
                sphVerts[j + 2] = cos1;																				// z
                sphVerts[j + 3] = 1.0;																				// w.		
            }
            if (s == 0) {	// finally, set some interesting colors for vertices:
                sphVerts[j + 4] = topColr[0];
                sphVerts[j + 5] = topColr[1];
                sphVerts[j + 6] = topColr[2];
            }
            else if (s == slices - 1) {
                sphVerts[j + 4] = botColr[0];
                sphVerts[j + 5] = botColr[1];
                sphVerts[j + 6] = botColr[2];
            }
            else {
                sphVerts[j + 4] = topColr[0];// equColr[0]; 
                sphVerts[j + 5] = topColr[1];// equColr[1]; 
                sphVerts[j + 6] = topColr[2];// equColr[2];					
            }
        }
    }
}

var floatsPerVert = 10;
function makeSphere1() {
    var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
    // (choose odd # or prime# to avoid accidental symmetry)
    var sliceVerts = 27;	// # of vertices around the top edge of the slice
    // (same number of vertices on bottom of slice, too)
    var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
    var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
    var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
    var sliceAngle = Math.PI / slices;	// lattitude angle spanned by one slice.

    // Create a (global) array to hold this sphere's vertices:
    sphVerts1 = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVert);
    // # of vertices * # of elements needed to store them. 
    // each slice requires 2*sliceVerts vertices except 1st and
    // last ones, which require only 2*sliceVerts-1.

    // Create dome-shaped top slice of sphere at z=+1
    // s counts slices; v counts vertices; 
    // j counts array elements (vertices * elements per vertex)
    var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;
    var j = 0;							// initialize our array index
    var isLast = 0;
    var isFirst = 1;
    for (s = 0; s < slices; s++) {	// for each slice of the sphere,
        // find sines & cosines for top and bottom of this slice
        if (s == 0) {
            isFirst = 1;	// skip 1st vertex of 1st slice.
            cos0 = 1.0; 	// initialize: start at north pole.
            sin0 = 0.0;
        }
        else {					// otherwise, new top edge == old bottom edge
            isFirst = 0;
            cos0 = cos1;
            sin0 = sin1;
        }								// & compute sine,cosine for new bottom edge.
        cos1 = Math.cos((s + 1) * sliceAngle);
        sin1 = Math.sin((s + 1) * sliceAngle);
        // go around the entire slice, generating TRIANGLE_STRIP verts
        // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
        if (s == slices - 1) isLast = 1;	// skip last vertex of last slice.
        for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVert) {
            if (v % 2 == 0) {				// put even# vertices at the the slice's top edge
                // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
                sphVerts1[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                sphVerts1[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                sphVerts1[j + 2] = cos0;
                sphVerts1[j + 3] = 1.0;
                sphVerts1[j + 7] = sphVerts1[j];
                sphVerts1[j + 8] = sphVerts1[j + 1];
                sphVerts1[j + 9] = sphVerts1[j + 2];
            }
            else { 	// put odd# vertices around the slice's lower edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                sphVerts1[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		// x
                sphVerts1[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);		// y
                sphVerts1[j + 2] = cos1;																				// z
                sphVerts1[j + 3] = 1.0;																				// w.	
                sphVerts1[j + 7] = sphVerts1[j];
                sphVerts1[j + 8] = sphVerts1[j + 1];
                sphVerts1[j + 9] = sphVerts1[j + 2];
            }
            if (s == 0) {	// finally, set some interesting colors for vertices:
                sphVerts1[j + 4] = topColr[0];
                sphVerts1[j + 5] = topColr[1];
                sphVerts1[j + 6] = topColr[2];
            }
            else if (s == slices - 1) {
                sphVerts1[j + 4] = botColr[0];
                sphVerts1[j + 5] = botColr[1];
                sphVerts1[j + 6] = botColr[2];
            }
            else {
                sphVerts1[j + 4] = topColr[0];// equColr[0]; 
                sphVerts1[j + 5] = topColr[1];// equColr[1]; 
                sphVerts1[j + 6] = topColr[2];// equColr[2];					
            }
        }
    }
}



//=============================================================================
//=============================================================================
function VBObox1() { // gouraud shading, diffuse lighting
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.

    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
    function makeStarterShapes() {
        starterShapes = new Float32Array([					// Array of vertex attribute values we will
            // transfer to GPU's vertex buffer object (VBO)
            // Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
            // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, sq23, sq29, thrd,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, sq23, sq29, thrd,
            // Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
            // Node 0 (apex, +z axis;  blue)
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, -sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, -sq23, sq29, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, -sq23, sq29, thrd,
            // Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
            // Node 0 (apex, +z axis;  blue) 
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, 0.0, -sq89, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -sq89, thrd,          																							//0.0, 0.0, 0.0, // Normals debug
            // Node 1 (base: lower rt; red) 
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -sq89, thrd,
            // Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0,

            // rectangle box for lamp
            //face 1: bottom
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // 3   arrays: 3214
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,           // 2
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 1.0, 0.0,                 // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,             // 4
            //face 2: top
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,               // 7   arrays: 7586
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,          // 5
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, -1.0, 0.0,              // 8
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,                // 6
            // face 3: right
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 1.0, 0.0, 0.0,      // 5   arrays: 5264
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,          // 2
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0,              // 6
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,            // 4
            // face 4: left
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,            // 8     arrays: 8713
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, -1.0, 0.0, 0.0,         // 7
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,        // 1
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0,          // 3
            //face 5: front      
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,          // 8    arrays: 8614
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,           // 6
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,       // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, 1.0,         // 4
            // face 6: back
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,            // 7
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,          // 5
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,            // 3
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, -1.0,          // 2

            // lamp head (10)
            0.0, 0.0, 0.0, 1.0, 0.9, 1.0, 0.7, 0.0, -1.0, 0.0,  // 1 
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0, // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            // lamp head base (10)
            0.0, 0.0, 1.0, 1.0, 0.3, 0.3, 0.3, 0.0, 1.0, 0.0,        // A
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,          // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,           // C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,        // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,         // E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,                  // G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,            // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // B
            // lamp head sides (24)
            //side 1
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,             // 2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,           // 3
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212,                 // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212, // C
            // side2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212, // 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212,// 4
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// D
            //side 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                // 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                 // 5
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,             // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,                  // E
            //side 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212, // 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212,// 7
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// G
            //side 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 6
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// F
            //side 6
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,               // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,           // 2
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,              // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,          // B

            //book stuff
            // book binding
            //bottom trap 1
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1 : 20 : black
            - 0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 2 (purple)
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 (black)
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 4 (purple)

            //side2
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 6 (white)

            //large bottom
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 6 (white)

            //top trap
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7 (yellow)
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8 (yellow)
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 5
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,

            //left
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 1
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0, // node 2
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,
            - 0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,

            //right
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0,// node 4
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,// node 6
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 3
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,

            //small top
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,// node 7
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,
            /////////////////////////////////////
            // book covers
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8
            -1.0, 0.0, -0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node A (pink)
            -1.0, 0.0, 0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node B (pink)

            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 
            1.0, 0.0, -0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node C (seafoam green)
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7
            1.0, 0.0, 0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node D (seafoam green)
            // book page
            0.0, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 1.1
            0.0, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 8.1
            -0.9, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node A.1 
            -0.9, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node B.1

            //laptop
            //screen
            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right front

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, // top right back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top right front

            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front

            //keyboard
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back right top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front right top

            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front right top

            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top


            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
        ])
    }
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'attribute vec4 a_Position;\n' +
        'attribute vec3 a_Color;\n' +
        'attribute vec3 a_Normal;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        'vec4 transVec = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
        'vec3 normVec = normalize(transVec.xyz);\n' +
        'vec3 lightVec = vec3(0.0, 0.5, 0.5);\n' +
        '  gl_Position = u_ModelMatrix * a_Position;\n' +
        '  v_Color = vec4(a_Color*dot(normVec, lightVec), 1.0);\n' +
        // '  v_Color = vec4(a_Color*dot(normVec,lightVec), 1.0);\n' +
        '}\n';

    // uniform for Mvp and model matrix -- for the specular term, you'll need a view vector.
    // will need to know diff between vertex position in world coords and camera pos to construct view vector
    // in shader
    // specular term will be hard to figure out in gouraud on the tetrahedra because there
    // arent enough vertices. may need to add another shape. boxes and spheres. 
    // 

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';


    var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    // for surface normals:
    var sq23 = Math.sqrt(2.0 / 3.0)
    var sq29 = Math.sqrt(2.0 / 9.0)
    var sq89 = Math.sqrt(8.0 / 9.0)
    var thrd = 1.0 / 3.0;
    makeSphere1();
    makeStarterShapes();
    this.vboVerts = (starterShapes.length + sphVerts1.length) / 10;

    this.vboContents = new Float32Array(starterShapes.length + sphVerts1.length);
    //this.vboContents = starterShapes;

    for (i = 0, j = 0; j < starterShapes.length; i++, j++) {
        this.vboContents[i] = starterShapes[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts1.length; i++, j++) {// don't initialize i -- reuse it!
        this.vboContents[i] = sphVerts1[j];
    }

    // # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex.

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Position. (4: x,y,z,w values)
    this.vboFcount_a_Color = 3;   // # of floats for this attrib (r,g,b values)
    this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Position +     // check the size of each and
        this.vboFcount_a_Color +
        this.vboFcount_a_Normal) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_Color = (this.vboFcount_a_Position) * this.FSIZE;
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position +
        this.vboFcount_a_Color) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							  // GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;							// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;							// GPU location: shader 'a_PtSiz1' attribute

    //---------------------- Uniform locations &values in our shaders
    this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_ModelMatrixLoc;						// GPU location for u_ModelMat uniform

    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc;


};


VBObox1.prototype.init = function () {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if (this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }

    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if (this.a_ColorLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Color');
        return -1;	// error exit.
    }

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if (this.a_NormalLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Normal');
        return -1;	// error exit.
    }


    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }

    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
    }
}

VBObox1.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.

    // a) select our shader program:
    gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  

    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
        this.vboLoc);			// the ID# the GPU uses for our VBO.

    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the 
        // number of bytes used to store one complete vertex.  If set 
        // to zero, the GPU gets attribute values sequentially from 
        // VBO, starting at 'Offset'.	
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Color);
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFcount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);
}

VBObox1.prototype.isReady = function () {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox1.prototype.adjust = function () {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,
    this.ModelMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ModelMatrix.set(g_worldMat);
    this.ModelMatrix.translate(1.0, 0.0, 0);						// then translate them.




    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
}

VBObox1.prototype.draw = function () {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }
    this.ModelMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.ModelMatrix.set(g_worldMat);


    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.NormalMatrix.setIdentity();
    this.ModelMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.NormalMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,



    this.ModelMatrix.translate(1.0, 0.0, 1);						// then translate them.
    this.NormalMatrix.translate(1.0, 0.0, 1);						// then translate them.
    // this.NormalMatrix.translate(2,0,0);


    this.ModelMatrix.translate(2, 4, 0);
    this.NormalMatrix.translate(2, 4, 0);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
        0, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.



    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);


    /// LAMP -------------- FIRST RECTANGLE

    this.ModelMatrix.translate(2, -4, 0);
    this.NormalMatrix.translate(2, -4, 0);

    this.ModelMatrix.rotate(90, 1, 0.0, 0);
    this.NormalMatrix.rotate(90, 1, 0.0, 0);

    this.ModelMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(g_angleNow1, 0, 0.0, 1);

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);

    // LAMP ----------------- SECOND RECTANGLE

    this.ModelMatrix.translate(0, 2.8, 0);
    this.NormalMatrix.translate(0, 2.8, 0);
    this.ModelMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);

    // LAMP ---------------------------- HEAD

    this.ModelMatrix.rotate(90, 0, 1, 0);
    this.NormalMatrix.rotate(90, 0, 1, 0);
    this.ModelMatrix.translate(0, 2.8, -0.5);
    this.NormalMatrix.translate(0, 2.8, -0.5);

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.drawArrays(gl.TRIANGLE_FAN, 36, 8);
    gl.drawArrays(gl.TRIANGLE_FAN, 44, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 52, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 56, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 60, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 64, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 68, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 72, 4);



    //// SPHERE

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.ModelMatrix.scale(2, 2, 2);
    this.NormalMatrix.scale(2, 2, 2);

    this.ModelMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.NormalMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.


    gl.drawArrays(gl.TRIANGLE_STRIP, 132, this.vboVerts - 132);
    //triangle fan 36, 5, fan 41, 5, fan 46, 5, fan 51, 5, triangle strip 56, 4



    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.ModelMatrix.translate(0, 2.8, 0.5);
    this.NormalMatrix.translate(0, 2.8, 0.5);

    this.ModelMatrix.rotate(90, 1, 0, 0);
    this.NormalMatrix.rotate(90, 1, 0, 0);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.

    //draw Book binding and covers
    gl.drawArrays(gl.TRIANGLE_STRIP, 76, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 80, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 84, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 88, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 92, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 96, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 100, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 104, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 108, 4);


    this.ModelMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.

    //draw page
    gl.drawArrays(gl.TRIANGLE_STRIP, 112, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.ModelMatrix.translate(0, 5, 0.5);
    this.NormalMatrix.translate(0, 5, 0.5);

    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.


    //draw laptop
    gl.drawArrays(gl.TRIANGLE_STRIP, 136, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 140, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 144, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 148, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 152, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 156, 4);

    this.ModelMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 116, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 120, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 124, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 128, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 132, 4);




    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
}


VBObox1.prototype.reload = function () {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}

/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox2() { // gouraud shading, blinn-phong lighting
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.

    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
    function makeStarterShapes() {
        starterShapes = new Float32Array([					// Array of vertex attribute values we will
            // transfer to GPU's vertex buffer object (VBO)
            // Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
            // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, sq23, sq29, thrd,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, sq23, sq29, thrd,
            // Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
            // Node 0 (apex, +z axis;  blue)
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, -sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, -sq23, sq29, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, -sq23, sq29, thrd,
            // Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
            // Node 0 (apex, +z axis;  blue) 
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, 0.0, -sq89, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -sq89, thrd,          																							//0.0, 0.0, 0.0, // Normals debug
            // Node 1 (base: lower rt; red) 
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -sq89, thrd,
            // Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0,

            // rectangle box for lamp
            //face 1: bottom
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // 3   arrays: 3214
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,           // 2
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 1.0, 0.0,                 // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,             // 4
            //face 2: top
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,               // 7   arrays: 7586
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,          // 5
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, -1.0, 0.0,              // 8
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,                // 6
            // face 3: right
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 1.0, 0.0, 0.0,      // 5   arrays: 5264
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,          // 2
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0,              // 6
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,            // 4
            // face 4: left
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,            // 8     arrays: 8713
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, -1.0, 0.0, 0.0,         // 7
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,        // 1
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0,          // 3
            //face 5: front      
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,          // 8    arrays: 8614
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,           // 6
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,       // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, 1.0,         // 4
            // face 6: back
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,            // 7
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,          // 5
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,            // 3
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, -1.0,          // 2

            // lamp head (10)
            0.0, 0.0, 0.0, 1.0, 0.9, 1.0, 0.7, 0.0, -1.0, 0.0,  // 1 
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0, // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            // lamp head base (10)
            0.0, 0.0, 1.0, 1.0, 0.3, 0.3, 0.3, 0.0, 1.0, 0.0,        // A
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,          // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,           // C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,        // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,         // E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,                  // G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,            // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // B
            // lamp head sides (24)
            //side 1
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,             // 2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,           // 3
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212,                 // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212, // C
            // side2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212, // 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212,// 4
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// D
            //side 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                // 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                 // 5
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,             // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,                  // E
            //side 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212, // 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212,// 7
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// G
            //side 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 6
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// F
            //side 6
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,               // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,           // 2
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,              // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,          // B

            //book stuff
            // book binding
            //bottom trap 1
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1 : 20 : black
            - 0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 2 (purple)
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 (black)
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 4 (purple)

            //side2
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 6 (white)

            //large bottom
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 6 (white)

            //top trap
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7 (yellow)
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8 (yellow)
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 5
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,

            //left
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 1
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0, // node 2
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,
            - 0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,

            //right
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0,// node 4
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,// node 6
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 3
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,

            //small top
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,// node 7
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,
            /////////////////////////////////////
            // book covers
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8
            -1.0, 0.0, -0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node A (pink)
            -1.0, 0.0, 0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node B (pink)

            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 
            1.0, 0.0, -0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node C (seafoam green)
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7
            1.0, 0.0, 0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node D (seafoam green)
            // book page
            0.0, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 1.1
            0.0, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 8.1
            -0.9, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node A.1 
            -0.9, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node B.1

            //laptop
            //screen
            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right front

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, // top right back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top right front

            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front

            //keyboard
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back right top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front right top

            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front right top

            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top


            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top

        ])
    }
    // declare light source position in world coords, later we can replace with a uniform 
    // take vertex, transform only by model matrix. 
    // take light source position - vertex position: our "L" vector, which we need to normalize.
    // then the V vector: from surface to camera's position in worldspace. that position is what we're using to position camera. 
    // it's the arg to LookAt function. eventually it will be a uniform. it can start fixed. 
    // calculate phong lighting effect: ambient, diffuse, and specular. add them all. ambient is illumination * reflectance, can be hard coded
    // diffuse term is diffuse illum * reflectance * nDotL. first two can be hardcoded.
    // then specular.
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision highp float;\n' +

        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform vec3 u_LightPosition;\n' +
        'uniform vec3 u_AmbientLight;\n' +
        'uniform vec3 u_eyePosWorld; \n' +
        'uniform vec3 u_lightSpec;\n' +

        'uniform vec3 u_LightColor;\n' +
        'attribute vec4 a_Position;\n' +
        'attribute vec3 a_Color;\n' +
        'attribute vec3 a_Normal;\n' +

        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        'vec4 normalInterp = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
        'vec3 normVec = normalize(normalInterp.xyz);\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        'vec4 pointP = u_ModelMatrix * a_Position;\n' +
        'vec3 lightVec = u_LightPosition - vec3(pointP); \n' +


        'vec3 L = normalize(lightVec); \n' +
        'vec3 N = normVec; \n' +

        'vec3 eyeDir = normalize(u_eyePosWorld - pointP.xyz); \n' +
        'vec3 lightDir = normalize(u_LightPosition - pointP.xyz); \n' +
        'vec3 H = normalize(eyeDir + lightDir); \n' +

        '  float nDotH = max(dot(H, N), 0.0);\n' + // nDotH is 

        '  vec3 ambient = u_AmbientLight * a_Color;\n' +

        '  float specular = 0.0;\n' +
        '  float lambertian = max(dot(L, N), 0.0);\n' +
        '  if(lambertian > 0.0) {\n' +
        '       vec3 R = reflect(-L, N);\n' + // reflected light vector
        '       vec3 V = normalize(vec3(gl_Position));\n' + // vector to viewer
        '       float shininessVal = 77.0;\n' + //shininess
        '       float specAngle = max(dot(R, V), 0.0);\n' + // vector to viewer
        '       specular = pow(nDotH, shininessVal);}\n' + // vector to viewer

        '  vec3 diffuse = u_LightColor * a_Color * lambertian;\n' +
        '  v_Color = vec4(diffuse + ambient + specular*u_lightSpec, 1.0);\n' +
        '}\n';

    // uniform for Mvp and model matrix -- for the specular term, you'll need a view vector.
    // will need to know diff between vertex position in world coords and camera pos to construct view vector
    // in shader
    // specular term will be hard to figure out in gouraud on the tetrahedra because there
    // arent enough vertices. may need to add another shape. boxes and spheres. 
    // 

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';


    var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    // for surface normals:
    var sq23 = Math.sqrt(2.0 / 3.0)
    var sq29 = Math.sqrt(2.0 / 9.0)
    var sq89 = Math.sqrt(8.0 / 9.0)
    var thrd = 1.0 / 3.0;
    makeSphere1();
    makeStarterShapes();
    this.vboVerts = (starterShapes.length + sphVerts1.length) / 10;

    this.vboContents = new Float32Array(starterShapes.length + sphVerts1.length);
    //this.vboContents = starterShapes;

    for (i = 0, j = 0; j < starterShapes.length; i++, j++) {
        this.vboContents[i] = starterShapes[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts1.length; i++, j++) {// don't initialize i -- reuse it!
        this.vboContents[i] = sphVerts1[j];
    }

    // # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex.

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Position. (4: x,y,z,w values)
    this.vboFcount_a_Color = 3;   // # of floats for this attrib (r,g,b values)
    this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Position +     // check the size of each and
        this.vboFcount_a_Color +
        this.vboFcount_a_Normal) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_Color = (this.vboFcount_a_Position) * this.FSIZE;
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position +
        this.vboFcount_a_Color) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							  // GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;							// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;							// GPU location: shader 'a_PtSiz1' attribute

    //---------------------- Uniform locations &values in our shaders
    this.MvpMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_MvpMatrixLoc;						// GPU location for u_ModelMat uniform

    this.ModelMatrix = new Matrix4();
    this.u_ModelMatrixLoc;

    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc;


};


VBObox2.prototype.init = function () {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if (this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }

    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if (this.a_ColorLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Color');
        return -1;	// error exit.
    }

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if (this.a_NormalLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Normal');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    if (!this.u_MvpMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_MvpMatrix uniform');
        return;
    }

    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }

    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
    }

    this.u_LightPosition = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPosition) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_LightPosition uniform');
        return;
    }

    this.u_AmbientLight = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_AmbientLight) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_AmbientLight uniform');
        return;
    }
    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    if (!this.u_eyePosWorld) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_eyePosWorld uniform');
        return;
    }

    this.u_LightColor = gl.getUniformLocation(this.shaderLoc, 'u_LightColor');
    if (!this.u_LightColor) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_LightColor uniform');
        return;
    }

    this.u_lightSpec = gl.getUniformLocation(this.shaderLoc, 'u_lightSpec');
    if (!this.u_lightSpec) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_lightSpec uniform');
        return;
    }


}

VBObox2.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.

    // a) select our shader program:
    gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  

    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
        this.vboLoc);			// the ID# the GPU uses for our VBO.

    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the 
        // number of bytes used to store one complete vertex.  If set 
        // to zero, the GPU gets attribute values sequentially from 
        // VBO, starting at 'Offset'.	
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Color);
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFcount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

}

VBObox2.prototype.isReady = function () {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox2.prototype.adjust = function () {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,
    this.ModelMatrix.setIdentity();
    //gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);


    this.MvpMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.MvpMatrix.set(g_worldMat);

    // to-do: some transformations to position 3d parts and assemble assemblies
    // for example: 
    // this.MvpMatrix.translate(1, 2, -1);
    // this.MvpMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // this.ModelMatrix.translate(1, 2, -1);
    // this.ModelMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // make sure all subsequent Mvp transforms are also applied to ModelMatrix

    //gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    var dr = document.getElementById("DR").value;
    var dg = document.getElementById("DG").value;
    var db = document.getElementById("DB").value;
    gl.uniform3f(this.u_LightColor, dr, dg, db);
    // Set the light direction (in the world coordinate)
    var xpos = document.getElementById("X").value;
    var ypos = document.getElementById("Y").value;
    var zpos = document.getElementById("Z").value;
    gl.uniform3f(this.u_LightPosition, xpos, ypos, zpos);
    // Set the ambient light
    var ar = document.getElementById("AR").value;
    var ag = document.getElementById("AG").value;
    var ab = document.getElementById("AB").value;
    gl.uniform3f(this.u_AmbientLight, ar, ag, ab);

    var sr = document.getElementById("SR").value;
    var sg = document.getElementById("SG").value;
    var sb = document.getElementById("SB").value;
    gl.uniform3f(this.u_lightSpec, sr, sg, sb);

    gl.uniform3f(this.u_eyePosWorld, e[0], e[1], e[2]);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);
}

VBObox2.prototype.draw = function () {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 200.0;



    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    //this.NormalMatrix.setIdentity();
    this.MvpMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.NormalMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.ModelMatrix.rotate(g_angleNow2, 0, 0, 1);



    this.MvpMatrix.translate(1.0, 0.0, 1);						// then translate them.
    this.ModelMatrix.translate(1.0, 0.0, 1);
    this.NormalMatrix.translate(1.0, 0.0, 1);						// then translate them.
    // this.NormalMatrix.translate(2,0,0);


    this.MvpMatrix.translate(2, 4, 0);
    this.ModelMatrix.translate(2, 4, 0);
    this.NormalMatrix.translate(2, 4, 0);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
        0, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(2, -4, 0);
    this.NormalMatrix.translate(2, -4, 0);
    this.ModelMatrix.translate(2, -4, 0);

    this.MvpMatrix.rotate(90, 1, 0.0, 0);
    this.NormalMatrix.rotate(90, 1, 0.0, 0);
    this.ModelMatrix.rotate(90, 1, 0.0, 0);

    this.MvpMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(g_angleNow1, 0, 0.0, 1);



    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);


    this.MvpMatrix.translate(0, 2.8, 0);
    this.NormalMatrix.translate(0, 2.8, 0);
    this.ModelMatrix.translate(0, 2.8, 0);

    this.MvpMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    //this.ModelMatrix.rotate(g_angle02, 0, 0, 1);

    //this.NormalMatrix.rotate(g_angle02, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);

    this.MvpMatrix.rotate(90, 0, 1, 0);
    this.NormalMatrix.rotate(90, 0, 1, 0);
    this.ModelMatrix.rotate(90, 0, 1, 0);

    this.MvpMatrix.translate(0, 2.8, -0.5);
    this.NormalMatrix.translate(0, 2.8, -0.5);
    this.ModelMatrix.translate(0, 2.8, -0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_FAN, 36, 8);
    gl.drawArrays(gl.TRIANGLE_FAN, 44, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 52, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 56, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 60, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 64, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 68, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 72, 4);


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);


    this.MvpMatrix.scale(2, 2, 2);
    this.NormalMatrix.scale(2, 2, 2);
    this.ModelMatrix.scale(2, 2, 2);

    this.MvpMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.NormalMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.ModelMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.


    gl.drawArrays(gl.TRIANGLE_STRIP, 132, this.vboVerts - 132);
    //triangle fan 36, 5, fan 41, 5, fan 46, 5, fan 51, 5, triangle strip 56, 4

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(0, 2.8, 0.5);
    this.ModelMatrix.translate(0, 2.8, 0.5);
    this.NormalMatrix.translate(0, 2.8, 0.5);

    this.MvpMatrix.rotate(90, 1, 0, 0);
    this.ModelMatrix.rotate(90, 1, 0, 0);
    this.NormalMatrix.rotate(90, 1, 0, 0);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw Book binding and covers
    gl.drawArrays(gl.TRIANGLE_STRIP, 76, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 80, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 84, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 88, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 92, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 96, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 100, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 104, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 108, 4);


    this.MvpMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw page
    gl.drawArrays(gl.TRIANGLE_STRIP, 112, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.MvpMatrix.translate(0, 5, 0.5);
    this.ModelMatrix.translate(0, 5, 0.5);
    this.NormalMatrix.translate(0, 5, 0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw laptop
    gl.drawArrays(gl.TRIANGLE_STRIP, 136, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 140, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 144, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 148, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 152, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 156, 4);

    this.MvpMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 116, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 120, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 124, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 128, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 132, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    //this.MvpMatrix.scale(2, 2, 2);

}


VBObox2.prototype.reload = function () {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}
/*
VBObox2.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any
// shader programs, attributes, uniforms, textures, samplers or other claims on
// GPU memory.  However, make sure this step is reversible by a call to
// 'restoreMe()': be sure to retain all our Float32Array data, all values for
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any
// shader programs, attributes, uniforms, textures, samplers or other claims on
// GPU memory.  Use our retained Float32Array data, all values for  uniforms,
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
//=============================================================================
function VBObox3() { // phong shading, blinn-phong lighting
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.

    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
    function makeStarterShapes() {
        starterShapes = new Float32Array([					// Array of vertex attribute values we will
            // transfer to GPU's vertex buffer object (VBO)
            // Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
            // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, sq23, sq29, thrd,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, sq23, sq29, thrd,
            // Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
            // Node 0 (apex, +z axis;  blue)
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, -sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, -sq23, sq29, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, -sq23, sq29, thrd,
            // Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
            // Node 0 (apex, +z axis;  blue) 
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, 0.0, -sq89, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -sq89, thrd,          																							//0.0, 0.0, 0.0, // Normals debug
            // Node 1 (base: lower rt; red) 
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -sq89, thrd,
            // Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0,

            // rectangle box for lamp
            //face 1: bottom
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // 3   arrays: 3214
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,           // 2
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 1.0, 0.0,                 // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,             // 4
            //face 2: top
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,               // 7   arrays: 7586
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,          // 5
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, -1.0, 0.0,              // 8
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,                // 6
            // face 3: right
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 1.0, 0.0, 0.0,      // 5   arrays: 5264
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,          // 2
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0,              // 6
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,            // 4
            // face 4: left
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,            // 8     arrays: 8713
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, -1.0, 0.0, 0.0,         // 7
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,        // 1
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0,          // 3
            //face 5: front      
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,          // 8    arrays: 8614
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,           // 6
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,       // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, 1.0,         // 4
            // face 6: back
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,            // 7
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,          // 5
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,            // 3
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, -1.0,          // 2

            // lamp head (10)
            0.0, 0.0, 0.0, 1.0, 0.9, 1.0, 0.7, 0.0, -1.0, 0.0,  // 1 
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0, // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            // lamp head base (10)
            0.0, 0.0, 1.0, 1.0, 0.3, 0.3, 0.3, 0.0, 1.0, 0.0,        // A
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,          // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,           // C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,        // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,         // E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,                  // G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,            // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // B
            // lamp head sides (24)
            //side 1
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,             // 2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,           // 3
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212,                 // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212, // C
            // side2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212, // 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212,// 4
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// D
            //side 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                // 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                 // 5
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,             // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,                  // E
            //side 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212, // 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212,// 7
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// G
            //side 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 6
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// F
            //side 6
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,               // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,           // 2
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,              // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,          // B

            //book stuff
            // book binding
            //bottom trap 1
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1 : 20 : black
            - 0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 2 (purple)
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 (black)
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 4 (purple)

            //side2
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 6 (white)

            //large bottom
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 6 (white)

            //top trap
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7 (yellow)
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8 (yellow)
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 5
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,

            //left
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 1
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0, // node 2
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,
            - 0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,

            //right
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0,// node 4
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,// node 6
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 3
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,

            //small top
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,// node 7
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,
            /////////////////////////////////////
            // book covers
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8
            -1.0, 0.0, -0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node A (pink)
            -1.0, 0.0, 0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node B (pink)

            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 
            1.0, 0.0, -0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node C (seafoam green)
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7
            1.0, 0.0, 0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node D (seafoam green)
            // book page
            0.0, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 1.1
            0.0, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 8.1
            -0.9, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node A.1 
            -0.9, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node B.1

            //laptop
            //screen
            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right front

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, // top right back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top right front

            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front

            //keyboard
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back right top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front right top

            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front right top

            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top


            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top

        ])
    }
    // declare light source position in world coords, later we can replace with a uniform 
    // take vertex, transform only by model matrix. 
    // take light source position - vertex position: our "L" vector, which we need to normalize.
    // then the V vector: from surface to camera's position in worldspace. that position is what we're using to position camera. 
    // it's the arg to LookAt function. eventually it will be a uniform. it can start fixed. 
    // calculate phong lighting effect: ambient, diffuse, and specular. add them all. ambient is illumination * reflectance, can be hard coded
    // diffuse term is diffuse illum * reflectance * nDotL. first two can be hardcoded.
    // then specular.
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision mediump float;\n' +
        'precision highp int;\n' +
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +

        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform vec3 u_LightPosition;\n' +
        'uniform vec3 u_AmbientLight;\n' +
        'uniform vec3 u_eyePosWorld; \n' +
        'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.

        'attribute vec4 a_Position;\n' +
        'attribute vec3 a_Normal;\n' +
        'attribute vec4 a_Color;\n' +
        'varying vec3 v_normalInterp;\n' +
        'varying vec3 v_Position;\n' +
        'varying vec3 v_ambient;\n' +
        'varying vec4 v_Color;\n' +

        'void main() {\n' +
        'vec4 normalWorld = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        'vec4 pointP = u_ModelMatrix * a_Position;\n' +

        'v_normalInterp = normalize(normalWorld.xyz);\n' +
        ' v_Color = a_Color;\n' +
        ' v_Position = pointP.xyz;\n' +
        '}\n';


    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'precision highp int;\n' +
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +

        'varying vec3 v_normalInterp;\n' +
        'varying vec3 v_Position;\n' +
        'varying vec3 v_ambient;\n' +
        'varying vec4 v_Color;\n' +
        'uniform vec3 u_LightPosition;\n' +
        'uniform vec3 u_eyePosWorld; \n' +
        'uniform vec3 u_Ia;\n' + //change to u_Ia add u_Id and u_Is
        'uniform vec3 u_Id;\n' +
        'uniform vec3 u_Is;\n' +
        'uniform vec3 u_Ka;\n' +
        'uniform vec3 u_Kd;\n' +
        'uniform vec3 u_Ks;\n' +
        'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.

        'void main() {\n' +
        'vec3 N = normalize(v_normalInterp);\n' +
        'vec3 L = normalize(u_LightPosition - v_Position.xyz); \n' +
        '  float nDotL = max(dot(L, N), 0.0);\n' +

        'vec3 eyeDir = normalize(u_eyePosWorld - v_Position.xyz); \n' +
        'vec3 H = normalize(eyeDir + L); \n' +
        '  float nDotH = max(dot(H, N), 0.0);\n' + // nDotH is 

        //replace with u_Ka u_Kd and u_Ks uniforms set by materials.js
        'vec3 Ka = u_Ka*v_Color.rgb;\n' + // reflectance 
        'vec3 Kd = 0.0*u_Kd + u_MatlSet[0].diff*v_Color.rgb;\n' +
        'vec3 Ks = u_Ks*v_Color.rgb;\n' +
        'float Kshiny = float(u_MatlSet[0].shiny);\n' + //also needs to be uniform I think


        'vec3 emissive = u_MatlSet[0].emit;\n' +
        'vec3 ambient = u_Ia * u_MatlSet[0].ambi + 0.0*Ka;\n' +
        'vec3 diffuse = u_Id * Kd * nDotL;\n' +

        '  float specular = 0.0;\n' +
        '  if(nDotL > 0.0) {\n' +
        '       specular = pow(nDotH, Kshiny);}\n' + // vector to viewer

        '  gl_FragColor = vec4(emissive+ ambient + diffuse + specular*u_Is*u_MatlSet[0].spec*v_Color.rgb + 0.0*Ks, 1.0);\n' +
        '}\n';

    var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    // for surface normals:
    var sq23 = Math.sqrt(2.0 / 3.0)
    var sq29 = Math.sqrt(2.0 / 9.0)
    var sq89 = Math.sqrt(8.0 / 9.0)
    var thrd = 1.0 / 3.0;
    makeSphere1();
    makeStarterShapes();
    this.vboVerts = (starterShapes.length + sphVerts1.length) / 10;

    this.vboContents = new Float32Array(starterShapes.length + sphVerts1.length);
    //this.vboContents = starterShapes;

    for (i = 0, j = 0; j < starterShapes.length; i++, j++) {
        this.vboContents[i] = starterShapes[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts1.length; i++, j++) {// don't initialize i -- reuse it!
        this.vboContents[i] = sphVerts1[j];
    }

    // # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex.

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Position. (4: x,y,z,w values)
    this.vboFcount_a_Color = 3;   // # of floats for this attrib (r,g,b values)
    this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Position +     // check the size of each and
        this.vboFcount_a_Color +
        this.vboFcount_a_Normal) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_Color = (this.vboFcount_a_Position) * this.FSIZE;
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position +
        this.vboFcount_a_Color) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							  // GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;							// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;							// GPU location: shader 'a_PtSiz1' attribute

    //---------------------- Uniform locations &values in our shaders
    this.MvpMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_MvpMatrixLoc;						// GPU location for u_ModelMat uniform

    this.ModelMatrix = new Matrix4();
    this.u_ModelMatrixLoc;

    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc;


};


VBObox3.prototype.init = function () {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if (this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }

    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if (this.a_ColorLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Color');
        return -1;	// error exit.
    }

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if (this.a_NormalLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Normal');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    if (!this.u_MvpMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_MvpMatrix uniform');
        return;
    }

    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }

    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
    }

    this.u_LightPosition = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPosition) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_LightPosition uniform');
        return;
    }


    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    if (!this.u_eyePosWorld) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_eyePosWorld uniform');
        return;
    }

    this.u_Ia = gl.getUniformLocation(this.shaderLoc, 'u_Ia');
    if (!this.u_Ia) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Ia uniform');
        return;
    }
    this.u_Ka = gl.getUniformLocation(this.shaderLoc, 'u_Ka');
    if (!this.u_Ka) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Ka uniform');
        return;
    }
    this.u_Id = gl.getUniformLocation(this.shaderLoc, 'u_Id');
    if (!this.u_Id) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Id uniform');
        return;
    }
    this.u_Is = gl.getUniformLocation(this.shaderLoc, 'u_Is');
    if (!this.u_Is) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Is uniform');
        return;
    }
    this.u_Kd = gl.getUniformLocation(this.shaderLoc, 'u_Kd');
    if (!this.u_Kd) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Kd uniform');
        return;
    }
    this.u_Ks = gl.getUniformLocation(this.shaderLoc, 'u_Ks');
    if (!this.u_Ks) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Ks uniform');
        return;
    }

    myMatl0.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
    myMatl0.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
    myMatl0.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
    myMatl0.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
    myMatl0.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
    if (!myMatl0.uLoc_Ke || !myMatl0.uLoc_Ka || !myMatl0.uLoc_Kd
        || !myMatl0.uLoc_Ks || !myMatl0.uLoc_Kshiny
    ) {
        console.log('Failed to get GPUs Reflectance storage locations');
        return;
    }


}

VBObox3.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.

    // a) select our shader program:
    gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  

    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
        this.vboLoc);			// the ID# the GPU uses for our VBO.

    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the 
        // number of bytes used to store one complete vertex.  If set 
        // to zero, the GPU gets attribute values sequentially from 
        // VBO, starting at 'Offset'.	
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Color);
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFcount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

}

VBObox3.prototype.isReady = function () {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox3.prototype.adjust = function () {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,
    this.ModelMatrix.setIdentity();
    //gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);


    this.MvpMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.MvpMatrix.set(g_worldMat);

    // to-do: some transformations to position 3d parts and assemble assemblies
    // for example: 
    // this.MvpMatrix.translate(1, 2, -1);
    // this.MvpMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // this.ModelMatrix.translate(1, 2, -1);
    // this.ModelMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // make sure all subsequent Mvp transforms are also applied to ModelMatrix

    //gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    // Set the light direction (in the world coordinate)
    var xpos = document.getElementById("X").value;
    var ypos = document.getElementById("Y").value;
    var zpos = document.getElementById("Z").value;
    gl.uniform3f(this.u_LightPosition, xpos, ypos, zpos);
    // Set the ambient light
    var ar = document.getElementById("AR").value;
    var ag = document.getElementById("AG").value;
    var ab = document.getElementById("AB").value;
    gl.uniform3f(this.u_Ia, ar, ag, ab);

    gl.uniform3f(this.u_Ka, 0.6, 0.6, 0.6);
    gl.uniform3f(this.u_eyePosWorld, e[0], e[1], e[2]);

    var dr = document.getElementById("DR").value;
    var dg = document.getElementById("DG").value;
    var db = document.getElementById("DB").value;
    gl.uniform3f(this.u_Id, dr, dg, db);

    var sr = document.getElementById("SR").value;
    var sg = document.getElementById("SG").value;
    var sb = document.getElementById("SB").value;
    gl.uniform3f(this.u_Is, sr, sg, sb);
    gl.uniform3f(this.u_Kd, 0.8, 0.8, 0.8);
    gl.uniform3f(this.u_Ks, 0.8, 0.8, 0.8);

    //---------------For the Material object(s):
    gl.uniform3fv(myMatl0.uLoc_Ke, myMatl0.K_emit.slice(0, 3));				// Ke emissive
    gl.uniform3fv(myMatl0.uLoc_Ka, myMatl0.K_ambi.slice(0, 3));				// Ka ambient
    gl.uniform3fv(myMatl0.uLoc_Kd, myMatl0.K_diff.slice(0, 3));				// Kd	diffuse
    gl.uniform3fv(myMatl0.uLoc_Ks, myMatl0.K_spec.slice(0, 3));				// Ks specular
    gl.uniform1i(myMatl0.uLoc_Kshiny, parseInt(myMatl0.K_shiny, 10));     // Kshiny 
    //	== specular exponent; (parseInt() converts from float to base-10 integer).
    // Test our Material object's values:
    //	console.log('matl0.K_emit', matl0.K_emit.slice(0,3), '\n');
    //	console.log('matl0.uLoc_Ke', matl0.uLoc_Ke, '\n'); //


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);
}

VBObox3.prototype.draw = function () {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 200.0;



    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    //this.NormalMatrix.setIdentity();
    this.MvpMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.NormalMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.ModelMatrix.rotate(g_angleNow2, 0, 0, 1);



    this.MvpMatrix.translate(1.0, 0.0, 1);						// then translate them.
    this.ModelMatrix.translate(1.0, 0.0, 1);
    this.NormalMatrix.translate(1.0, 0.0, 1);						// then translate them.
    // this.NormalMatrix.translate(2,0,0);


    this.MvpMatrix.translate(2, 4, 0);
    this.ModelMatrix.translate(2, 4, 0);
    this.NormalMatrix.translate(2, 4, 0);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
        0, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(2, -4, 0);
    this.NormalMatrix.translate(2, -4, 0);
    this.ModelMatrix.translate(2, -4, 0);

    this.MvpMatrix.rotate(90, 1, 0.0, 0);
    this.NormalMatrix.rotate(90, 1, 0.0, 0);
    this.ModelMatrix.rotate(90, 1, 0.0, 0);

    this.MvpMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(g_angleNow1, 0, 0.0, 1);



    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);


    this.MvpMatrix.translate(0, 2.8, 0);
    this.NormalMatrix.translate(0, 2.8, 0);
    this.ModelMatrix.translate(0, 2.8, 0);

    this.MvpMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    //this.ModelMatrix.rotate(g_angle02, 0, 0, 1);

    //this.NormalMatrix.rotate(g_angle02, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);

    this.MvpMatrix.rotate(90, 0, 1, 0);
    this.NormalMatrix.rotate(90, 0, 1, 0);
    this.ModelMatrix.rotate(90, 0, 1, 0);

    this.MvpMatrix.translate(0, 2.8, -0.5);
    this.NormalMatrix.translate(0, 2.8, -0.5);
    this.ModelMatrix.translate(0, 2.8, -0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_FAN, 36, 8);
    gl.drawArrays(gl.TRIANGLE_FAN, 44, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 52, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 56, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 60, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 64, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 68, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 72, 4);


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);


    this.MvpMatrix.scale(2, 2, 2);
    this.NormalMatrix.scale(2, 2, 2);
    this.ModelMatrix.scale(2, 2, 2);

    this.MvpMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.NormalMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.ModelMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //this is where we would set the material I think but I am really confused about that... how do we prevent the material from being
    //applied to all objects in the VBObox?
    //Honestly considering reaching out to someone else in the class
    // gl.uniform3fv(u_KeLoc?CHECKTHIS, matl0.K_emit.slice(0, 3));				// Ke emissive
    // gl.uniform3fv(u_KaLoc?, matl0.K_ambi.slice(0, 3));				// Ka ambient
    // gl.uniform3fv(u_KdLoc?, matl0.K_diff.slice(0, 3));				// Kd	diffuse
    // gl.uniform3fv(u_KsLoc?, matl0.K_spec.slice(0, 3));				// Ks specular
    // gl.uniform1i(KshinyLoc?, parseInt(matl0.K_shiny, 10));     // Kshiny

    gl.drawArrays(gl.TRIANGLE_STRIP, 132, this.vboVerts - 132);
    //triangle fan 36, 5, fan 41, 5, fan 46, 5, fan 51, 5, triangle strip 56, 4

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(0, 2.8, 0.5);
    this.ModelMatrix.translate(0, 2.8, 0.5);
    this.NormalMatrix.translate(0, 2.8, 0.5);

    this.MvpMatrix.rotate(90, 1, 0, 0);
    this.ModelMatrix.rotate(90, 1, 0, 0);
    this.NormalMatrix.rotate(90, 1, 0, 0);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw Book binding and covers
    gl.drawArrays(gl.TRIANGLE_STRIP, 76, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 80, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 84, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 88, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 92, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 96, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 100, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 104, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 108, 4);


    this.MvpMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw page
    gl.drawArrays(gl.TRIANGLE_STRIP, 112, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.MvpMatrix.translate(0, 5, 0.5);
    this.ModelMatrix.translate(0, 5, 0.5);
    this.NormalMatrix.translate(0, 5, 0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw laptop
    gl.drawArrays(gl.TRIANGLE_STRIP, 136, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 140, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 144, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 148, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 152, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 156, 4);

    this.MvpMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 116, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 120, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 124, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 128, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 132, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    //this.MvpMatrix.scale(2, 2, 2);

}


VBObox3.prototype.reload = function () {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}

function VBObox4() { // gouraud shading, phong lighting
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.

    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
    function makeStarterShapes() {
        starterShapes = new Float32Array([					// Array of vertex attribute values we will
            // transfer to GPU's vertex buffer object (VBO)
            // Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
            // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, sq23, sq29, thrd,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, sq23, sq29, thrd,
            // Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
            // Node 0 (apex, +z axis;  blue)
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, -sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, -sq23, sq29, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, -sq23, sq29, thrd,
            // Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
            // Node 0 (apex, +z axis;  blue) 
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, 0.0, -sq89, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -sq89, thrd,          																							//0.0, 0.0, 0.0, // Normals debug
            // Node 1 (base: lower rt; red) 
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -sq89, thrd,
            // Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0,

            // rectangle box for lamp
            //face 1: bottom
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // 3   arrays: 3214
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,           // 2
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 1.0, 0.0,                 // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,             // 4
            //face 2: top
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,               // 7   arrays: 7586
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,          // 5
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, -1.0, 0.0,              // 8
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,                // 6
            // face 3: right
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 1.0, 0.0, 0.0,      // 5   arrays: 5264
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,          // 2
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0,              // 6
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,            // 4
            // face 4: left
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,            // 8     arrays: 8713
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, -1.0, 0.0, 0.0,         // 7
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,        // 1
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0,          // 3
            //face 5: front      
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,          // 8    arrays: 8614
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,           // 6
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,       // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, 1.0,         // 4
            // face 6: back
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,            // 7
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,          // 5
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,            // 3
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, -1.0,          // 2

            // lamp head (10)
            0.0, 0.0, 0.0, 1.0, 0.9, 1.0, 0.7, 0.0, -1.0, 0.0,  // 1 
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0, // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            // lamp head base (10)
            0.0, 0.0, 1.0, 1.0, 0.3, 0.3, 0.3, 0.0, 1.0, 0.0,        // A
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,          // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,           // C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,        // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,         // E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,                  // G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,            // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // B
            // lamp head sides (24)
            //side 1
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,             // 2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,           // 3
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212,                 // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212, // C
            // side2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212, // 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212,// 4
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// D
            //side 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                // 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                 // 5
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,             // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,                  // E
            //side 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212, // 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212,// 7
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// G
            //side 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 6
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// F
            //side 6
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,               // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,           // 2
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,              // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,          // B

            //book stuff
            // book binding
            //bottom trap 1
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1 : 20 : black
            - 0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 2 (purple)
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 (black)
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 4 (purple)

            //side2
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 6 (white)

            //large bottom
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 6 (white)

            //top trap
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7 (yellow)
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8 (yellow)
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 5
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,

            //left
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 1
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0, // node 2
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,
            - 0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,

            //right
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0,// node 4
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,// node 6
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 3
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,

            //small top
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,// node 7
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,
            /////////////////////////////////////
            // book covers
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8
            -1.0, 0.0, -0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node A (pink)
            -1.0, 0.0, 0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node B (pink)

            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 
            1.0, 0.0, -0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node C (seafoam green)
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7
            1.0, 0.0, 0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node D (seafoam green)
            // book page
            0.0, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 1.1
            0.0, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 8.1
            -0.9, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node A.1 
            -0.9, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node B.1

            //laptop
            //screen
            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right front

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, // top right back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top right front

            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front

            //keyboard
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back right top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front right top

            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front right top

            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top


            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top

        ])
    }
    // declare light source position in world coords, later we can replace with a uniform 
    // take vertex, transform only by model matrix. 
    // take light source position - vertex position: our "L" vector, which we need to normalize.
    // then the V vector: from surface to camera's position in worldspace. that position is what we're using to position camera. 
    // it's the arg to LookAt function. eventually it will be a uniform. it can start fixed. 
    // calculate phong lighting effect: ambient, diffuse, and specular. add them all. ambient is illumination * reflectance, can be hard coded
    // diffuse term is diffuse illum * reflectance * nDotL. first two can be hardcoded.
    // then specular.
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision highp float;\n' +

        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform vec3 u_LightPosition;\n' +
        'uniform vec3 u_AmbientLight;\n' +
        'uniform vec3 u_eyePosWorld; \n' +
        'uniform vec3 u_lightSpec;\n' +

        'uniform vec3 u_LightColor;\n' +
        'attribute vec4 a_Position;\n' +
        'attribute vec3 a_Color;\n' +
        'attribute vec3 a_Normal;\n' +

        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        'vec4 normalInterp = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
        'vec3 normVec = normalize(normalInterp.xyz);\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        'vec4 pointP = u_ModelMatrix * a_Position;\n' +
        'vec3 lightVec = u_LightPosition - vec3(pointP); \n' +


        'vec3 L = normalize(lightVec); \n' +
        'vec3 N = normVec; \n' +

        'vec3 eyeDir = normalize(u_eyePosWorld - pointP.xyz); \n' +
        'vec3 lightDir = normalize(u_LightPosition - pointP.xyz); \n' +
        'vec3 H = normalize(eyeDir + lightDir); \n' +

        '  float nDotH = max(dot(H, N), 0.0);\n' + // nDotH is 

        '  vec3 ambient = u_AmbientLight * a_Color;\n' +

        '  float specular = 0.0;\n' +
        '  float lambertian = max(dot(L, N), 0.0);\n' +
        '  if(lambertian > 0.0) {\n' +
        '       vec3 R = reflect(-L, N);\n' + // reflected light vector
        '       vec3 V = eyeDir;\n' + // vector to viewer
        '       float shininessVal = 77.0;\n' + //shininess
        '       float specAngle = max(dot(R, V), 0.0);\n' + // vector to viewer
        '       specular = pow(specAngle, shininessVal);}\n' + // vector to viewer

        '  vec3 diffuse = u_LightColor * a_Color * lambertian;\n' +
        '  v_Color = vec4(diffuse + ambient + specular*u_lightSpec, 1.0);\n' +
        '}\n';

    // uniform for Mvp and model matrix -- for the specular term, you'll need a view vector.
    // will need to know diff between vertex position in world coords and camera pos to construct view vector
    // in shader
    // specular term will be hard to figure out in gouraud on the tetrahedra because there
    // arent enough vertices. may need to add another shape. boxes and spheres. 
    // 

    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';


    var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    // for surface normals:
    var sq23 = Math.sqrt(2.0 / 3.0)
    var sq29 = Math.sqrt(2.0 / 9.0)
    var sq89 = Math.sqrt(8.0 / 9.0)
    var thrd = 1.0 / 3.0;
    makeSphere1();
    makeStarterShapes();
    this.vboVerts = (starterShapes.length + sphVerts1.length) / 10;

    this.vboContents = new Float32Array(starterShapes.length + sphVerts1.length);
    //this.vboContents = starterShapes;

    for (i = 0, j = 0; j < starterShapes.length; i++, j++) {
        this.vboContents[i] = starterShapes[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts1.length; i++, j++) {// don't initialize i -- reuse it!
        this.vboContents[i] = sphVerts1[j];
    }

    // # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex.

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Position. (4: x,y,z,w values)
    this.vboFcount_a_Color = 3;   // # of floats for this attrib (r,g,b values)
    this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Position +     // check the size of each and
        this.vboFcount_a_Color +
        this.vboFcount_a_Normal) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_Color = (this.vboFcount_a_Position) * this.FSIZE;
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position +
        this.vboFcount_a_Color) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							  // GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;							// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;							// GPU location: shader 'a_PtSiz1' attribute

    //---------------------- Uniform locations &values in our shaders
    this.MvpMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_MvpMatrixLoc;						// GPU location for u_ModelMat uniform

    this.ModelMatrix = new Matrix4();
    this.u_ModelMatrixLoc;

    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc;


};


VBObox4.prototype.init = function () {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if (this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }

    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if (this.a_ColorLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Color');
        return -1;	// error exit.
    }

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if (this.a_NormalLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Normal');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    if (!this.u_MvpMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_MvpMatrix uniform');
        return;
    }

    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }

    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
    }

    this.u_LightPosition = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPosition) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_LightPosition uniform');
        return;
    }

    this.u_AmbientLight = gl.getUniformLocation(this.shaderLoc, 'u_AmbientLight');
    if (!this.u_AmbientLight) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_AmbientLight uniform');
        return;
    }
    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    if (!this.u_eyePosWorld) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_eyePosWorld uniform');
        return;
    }

    this.u_LightColor = gl.getUniformLocation(this.shaderLoc, 'u_LightColor');
    if (!this.u_LightColor) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_LightColor uniform');
        return;
    }

    this.u_lightSpec = gl.getUniformLocation(this.shaderLoc, 'u_lightSpec');
    if (!this.u_lightSpec) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_lightSpec uniform');
        return;
    }

}

VBObox4.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.

    // a) select our shader program:
    gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  

    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
        this.vboLoc);			// the ID# the GPU uses for our VBO.

    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the 
        // number of bytes used to store one complete vertex.  If set 
        // to zero, the GPU gets attribute values sequentially from 
        // VBO, starting at 'Offset'.	
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Color);
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFcount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

}

VBObox4.prototype.isReady = function () {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox4.prototype.adjust = function () {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,
    this.ModelMatrix.setIdentity();
    //gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);


    this.MvpMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.MvpMatrix.set(g_worldMat);

    // to-do: some transformations to position 3d parts and assemble assemblies
    // for example: 
    // this.MvpMatrix.translate(1, 2, -1);
    // this.MvpMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // this.ModelMatrix.translate(1, 2, -1);
    // this.ModelMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // make sure all subsequent Mvp transforms are also applied to ModelMatrix

    //gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    var dr = document.getElementById("DR").value;
    var dg = document.getElementById("DG").value;
    var db = document.getElementById("DB").value;
    gl.uniform3f(this.u_LightColor, dr, dg, db);
    // Set the light direction (in the world coordinate)
    var xpos = document.getElementById("X").value;
    var ypos = document.getElementById("Y").value;
    var zpos = document.getElementById("Z").value;
    gl.uniform3f(this.u_LightPosition, xpos, ypos, zpos);
    // Set the ambient light
    var ar = document.getElementById("AR").value;
    var ag = document.getElementById("AG").value;
    var ab = document.getElementById("AB").value;
    gl.uniform3f(this.u_AmbientLight, ar, ag, ab);

    var sr = document.getElementById("SR").value;
    var sg = document.getElementById("SG").value;
    var sb = document.getElementById("SB").value;
    gl.uniform3f(this.u_lightSpec, sr, sg, sb);

    gl.uniform3f(this.u_eyePosWorld, e[0], e[1], e[2]);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);
}

VBObox4.prototype.draw = function () {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 200.0;



    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    //this.NormalMatrix.setIdentity();
    this.MvpMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.NormalMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.ModelMatrix.rotate(g_angleNow2, 0, 0, 1);



    this.MvpMatrix.translate(1.0, 0.0, 1);						// then translate them.
    this.ModelMatrix.translate(1.0, 0.0, 1);
    this.NormalMatrix.translate(1.0, 0.0, 1);						// then translate them.
    // this.NormalMatrix.translate(2,0,0);


    this.MvpMatrix.translate(2, 4, 0);
    this.ModelMatrix.translate(2, 4, 0);
    this.NormalMatrix.translate(2, 4, 0);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
        0, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(2, -4, 0);
    this.NormalMatrix.translate(2, -4, 0);
    this.ModelMatrix.translate(2, -4, 0);

    this.MvpMatrix.rotate(90, 1, 0.0, 0);
    this.NormalMatrix.rotate(90, 1, 0.0, 0);
    this.ModelMatrix.rotate(90, 1, 0.0, 0);

    this.MvpMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(g_angleNow1, 0, 0.0, 1);



    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);


    this.MvpMatrix.translate(0, 2.8, 0);
    this.NormalMatrix.translate(0, 2.8, 0);
    this.ModelMatrix.translate(0, 2.8, 0);

    this.MvpMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    //this.ModelMatrix.rotate(g_angle02, 0, 0, 1);

    //this.NormalMatrix.rotate(g_angle02, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);

    this.MvpMatrix.rotate(90, 0, 1, 0);
    this.NormalMatrix.rotate(90, 0, 1, 0);
    this.ModelMatrix.rotate(90, 0, 1, 0);

    this.MvpMatrix.translate(0, 2.8, -0.5);
    this.NormalMatrix.translate(0, 2.8, -0.5);
    this.ModelMatrix.translate(0, 2.8, -0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_FAN, 36, 8);
    gl.drawArrays(gl.TRIANGLE_FAN, 44, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 52, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 56, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 60, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 64, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 68, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 72, 4);


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);


    this.MvpMatrix.scale(2, 2, 2);
    this.NormalMatrix.scale(2, 2, 2);
    this.ModelMatrix.scale(2, 2, 2);

    this.MvpMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.NormalMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.ModelMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.


    gl.drawArrays(gl.TRIANGLE_STRIP, 132, this.vboVerts - 132);
    //triangle fan 36, 5, fan 41, 5, fan 46, 5, fan 51, 5, triangle strip 56, 4

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(0, 2.8, 0.5);
    this.ModelMatrix.translate(0, 2.8, 0.5);
    this.NormalMatrix.translate(0, 2.8, 0.5);

    this.MvpMatrix.rotate(90, 1, 0, 0);
    this.ModelMatrix.rotate(90, 1, 0, 0);
    this.NormalMatrix.rotate(90, 1, 0, 0);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw Book binding and covers
    gl.drawArrays(gl.TRIANGLE_STRIP, 76, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 80, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 84, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 88, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 92, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 96, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 100, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 104, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 108, 4);


    this.MvpMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw page
    gl.drawArrays(gl.TRIANGLE_STRIP, 112, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.MvpMatrix.translate(0, 5, 0.5);
    this.ModelMatrix.translate(0, 5, 0.5);
    this.NormalMatrix.translate(0, 5, 0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw laptop
    gl.drawArrays(gl.TRIANGLE_STRIP, 136, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 140, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 144, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 148, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 152, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 156, 4);

    this.MvpMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 116, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 120, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 124, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 128, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 132, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    //this.MvpMatrix.scale(2, 2, 2);

}


VBObox4.prototype.reload = function () {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}

function VBObox5() { // phong shading, phong lighting
    //=============================================================================
    //=============================================================================
    // CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
    // needed to render vertices from one Vertex Buffer Object (VBO) using one 
    // separate shader program (a vertex-shader & fragment-shader pair) and one
    // set of 'uniform' variables.

    // Constructor goal: 
    // Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
    // written into code) in all other VBObox functions. Keeping all these (initial)
    // values here, in this one coonstrutor function, ensures we can change them 
    // easily WITHOUT disrupting any other code, ever!
    function makeStarterShapes() {
        starterShapes = new Float32Array([					// Array of vertex attribute values we will
            // transfer to GPU's vertex buffer object (VBO)
            // Face 0: (right side).  Unit Normal Vector: N0 = (sq23, sq29, thrd)
            // Node 0 (apex, +z axis; 			color--blue, 				surf normal (all verts):
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, sq23, sq29, thrd,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, sq23, sq29, thrd,
            // Face 1: (left side).		Unit Normal Vector: N1 = (-sq23, sq29, thrd)
            // Node 0 (apex, +z axis;  blue)
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, -sq23, sq29, thrd,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, -sq23, sq29, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, -sq23, sq29, thrd,
            // Face 2: (lower side) 	Unit Normal Vector: N2 = (0.0, -sq89, thrd)
            // Node 0 (apex, +z axis;  blue) 
            0.0, 0.0, sq2, 1.0, 0.0, 0.0, 1.0, 0.0, -sq89, thrd,
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -sq89, thrd,          																							//0.0, 0.0, 0.0, // Normals debug
            // Node 1 (base: lower rt; red) 
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -sq89, thrd,
            // Face 3: (base side)  Unit Normal Vector: N2 = (0.0, 0.0, -1.0)
            // Node 3 (base:lower lft; white)
            -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,
            // Node 2 (base: +y axis;  grn)
            0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, -1.0,
            // Node 1 (base: lower rt; red)
            c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -1.0,

            // rectangle box for lamp
            //face 1: bottom
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // 3   arrays: 3214
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,           // 2
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 1.0, 0.0,                 // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 1.0, 0.0,             // 4
            //face 2: top
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,               // 7   arrays: 7586
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, -1.0, 0.0,          // 5
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, -1.0, 0.0,              // 8
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,                // 6
            // face 3: right
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 1.0, 0.0, 0.0,      // 5   arrays: 5264
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,          // 2
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0,              // 6
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 1.0, 0.0, 0.0,            // 4
            // face 4: left
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,            // 8     arrays: 8713
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, -1.0, 0.0, 0.0,         // 7
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, -1.0, 0.0, 0.0,        // 1
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0,          // 3
            //face 5: front      
            -0.2, 3.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,          // 8    arrays: 8614
            0.2, 3.0, 0.2, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0,           // 6
            -0.2, 0.0, 0.2, 1.0, 0.2, 0.0, 0.7, 0.0, 0.0, 1.0,       // 1
            0.2, 0.0, 0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, 1.0,         // 4
            // face 6: back
            -0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,            // 7
            0.2, 3.0, -0.2, 1.0, 0.3, 0.2, 0.5, 0.0, 0.0, -1.0,          // 5
            -0.2, 0.0, -0.2, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,            // 3
            0.2, 0.0, -0.2, 1.0, 0.5, 0.0, 0.2, 0.0, 0.0, -1.0,          // 2

            // lamp head (10)
            0.0, 0.0, 0.0, 1.0, 0.9, 1.0, 0.7, 0.0, -1.0, 0.0,  // 1 
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0, // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,  // 2  
            // lamp head base (10)
            0.0, 0.0, 1.0, 1.0, 0.3, 0.3, 0.3, 0.0, 1.0, 0.0,        // A
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,          // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,           // C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,        // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,         // E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,                  // G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,            // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,             // B
            // lamp head sides (24)
            //side 1
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,             // 2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, 0.489, 0.212,           // 3
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212,                 // B
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, 0.489, 0.212, // C
            // side2
            -0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212, // 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.977, 0.212,// 4
            -0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// C
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.977, 0.212,// D
            //side 3
            0.5, c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                // 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, 0.489, 0.212,                 // 5
            0.375, c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,             // D
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, 0.489, 0.212,                  // E
            //side 4
            1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212, // 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.846, -0.489, 0.212,// 7
            0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// E
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.846, -0.489, 0.212,// G
            //side 5
            0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 7
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, -0.977, 0.212,// 6
            0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// G
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.977, 0.212,// F
            //side 6
            -0.5, -c30, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,               // 6
            -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -0.846, -0.489, 0.212,           // 2
            -0.375, -c30 * 3 / 4, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,              // F
            -0.75, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, -0.846, -0.489, 0.212,          // B

            //book stuff
            // book binding
            //bottom trap 1
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1 : 20 : black
            - 0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 2 (purple)
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 (black)
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 0.0, -1.0,// node 4 (purple)

            //side2
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0,// node 6 (white)

            //large bottom
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 2
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 0.0, -1.0, 0.0,// node 4
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 5 (white)
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, -1.0, 0.0,// node 6 (white)

            //top trap
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7 (yellow)
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8 (yellow)
            -0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 5
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,

            //left
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 1
            -0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0, // node 2
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,
            - 0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,

            //right
            0.2, -0.2, -0.5, 1.0, 0.5, 0.0, 1.0, 1, 1, 0.0,// node 4
            0.2, -0.2, 0.5, 1.0, 1.0, 1.0, 1.0, 1, 1, 0.0,// node 6
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 1, 1, 0.0,// node 3
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 1, 1, 0.0,

            //small top
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,// node 7
            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0,
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 1.0, 0.0,
            /////////////////////////////////////
            // book covers
            -0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 1
            -0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 8
            -1.0, 0.0, -0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node A (pink)
            -1.0, 0.0, 0.5, 1.0, 0.9, 0.7, 0.9, 0.0, 0.0, -1.0,// Node B (pink)

            0.1, 0.0, -0.5, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, -1.0,// node 3 
            1.0, 0.0, -0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node C (seafoam green)
            0.1, 0.0, 0.5, 1.0, 1.0, 0.9, 0.0, 0.0, 0.0, -1.0,// node 7
            1.0, 0.0, 0.5, 1.0, 0.7, 0.9, 0.7, 0.0, 0.0, -1.0,// Node D (seafoam green)
            // book page
            0.0, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 1.1
            0.0, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// node 8.1
            -0.9, 0.0, -0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node A.1 
            -0.9, 0.0, 0.45, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, -1.0,// Node B.1

            //laptop
            //screen
            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right front

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left back
            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, // top right back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top left front
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //top right front

            0.75, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, // top right back
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back
            0.75, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top right front
            0.75, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom right back

            0.0, 0.0, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left back
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left back
            0.0, 0.05, 0.5, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //top left front
            0.0, 0.05, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //bottom left front

            //keyboard
            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //back right top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, //front right top

            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //back right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 0.0, -1.0, //front right top

            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top


            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.75, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front right top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.0, 0.5, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.0, 0.5, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //front left top

            0.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left top
            0.75, 0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top
            0.0, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back left bottom
            0.75, 0.0, -0.05, 1.0, 0.5, 0.5, 0.5, 0.0, 1.0, 0.0, //back right top

        ])
    }
    // declare light source position in world coords, later we can replace with a uniform 
    // take vertex, transform only by model matrix. 
    // take light source position - vertex position: our "L" vector, which we need to normalize.
    // then the V vector: from surface to camera's position in worldspace. that position is what we're using to position camera. 
    // it's the arg to LookAt function. eventually it will be a uniform. it can start fixed. 
    // calculate phong lighting effect: ambient, diffuse, and specular. add them all. ambient is illumination * reflectance, can be hard coded
    // diffuse term is diffuse illum * reflectance * nDotL. first two can be hardcoded.
    // then specular.
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
        'precision mediump float;\n' +
        'precision highp int;\n' +
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +

        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'uniform mat4 u_ModelMatrix;\n' +
        'uniform vec3 u_LightPosition;\n' +
        'uniform vec3 u_AmbientLight;\n' +
        'uniform vec3 u_eyePosWorld; \n' +
        'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.

        'attribute vec4 a_Position;\n' +
        'attribute vec3 a_Normal;\n' +
        'attribute vec4 a_Color;\n' +
        'varying vec3 v_normalInterp;\n' +
        'varying vec3 v_Position;\n' +
        'varying vec3 v_ambient;\n' +
        'varying vec4 v_Color;\n' +

        'void main() {\n' +
        'vec4 normalWorld = u_NormalMatrix * vec4(a_Normal, 0.0);\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        'vec4 pointP = u_ModelMatrix * a_Position;\n' +

        'v_normalInterp = normalize(normalWorld.xyz);\n' +
        ' v_Color = a_Color;\n' +
        ' v_Position = pointP.xyz;\n' +
        '}\n';


    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
        'precision mediump float;\n' +
        'precision highp int;\n' +
        'struct MatlT {\n' +		// Describes one Phong material by its reflectances:
        '		vec3 emit;\n' +			// Ke: emissive -- surface 'glow' amount (r,g,b);
        '		vec3 ambi;\n' +			// Ka: ambient reflectance (r,g,b)
        '		vec3 diff;\n' +			// Kd: diffuse reflectance (r,g,b)
        '		vec3 spec;\n' + 		// Ks: specular reflectance (r,g,b)
        '		int shiny;\n' +			// Kshiny: specular exponent (integer >= 1; typ. <200)
        '		};\n' +

        'varying vec3 v_normalInterp;\n' +
        'varying vec3 v_Position;\n' +
        'varying vec3 v_ambient;\n' +
        'varying vec4 v_Color;\n' +
        'uniform vec3 u_LightPosition;\n' +
        'uniform vec3 u_eyePosWorld; \n' +
        'uniform vec3 u_Ia;\n' + //change to u_Ia add u_Id and u_Is
        'uniform vec3 u_Id;\n' +
        'uniform vec3 u_Is;\n' +
        'uniform vec3 u_Ka;\n' +
        'uniform vec3 u_Kd;\n' +
        'uniform vec3 u_Ks;\n' +
        'uniform MatlT u_MatlSet[1];\n' +		// Array of all materials.

        'void main() {\n' +
        'vec3 N = normalize(v_normalInterp);\n' +
        'vec3 L = normalize(u_LightPosition - v_Position.xyz); \n' +
        '  float nDotL = max(dot(L, N), 0.0);\n' +

        'vec3 eyeDir = normalize(u_eyePosWorld - v_Position.xyz); \n' +
        'vec3 H = normalize(eyeDir + L); \n' +
        '  float nDotH = max(dot(H, N), 0.0);\n' + // nDotH is 

        //replace with u_Ka u_Kd and u_Ks uniforms set by materials.js
        'vec3 Ka = u_Ka*v_Color.rgb;\n' + // reflectance 
        'vec3 Kd = 0.0*u_Kd + u_MatlSet[0].diff*v_Color.rgb;\n' +
        'vec3 Ks = u_Ks*v_Color.rgb;\n' +
        'float Kshiny = float(u_MatlSet[0].shiny);\n' + //also needs to be uniform I think


        'vec3 emissive = u_MatlSet[0].emit;\n' +
        'vec3 ambient = u_Ia * u_MatlSet[0].ambi + 0.0*Ka;\n' +
        'vec3 diffuse = u_Id * Kd * nDotL;\n' +

        '  float specular = 0.0;\n' +
        '  if(nDotL > 0.0) {\n' +
        '       vec3 R = reflect(-L, N);\n' + // reflected light vector
        '       vec3 V = eyeDir;\n' + // vector to viewer
        '       float specAngle = max(dot(R, V), 0.0);\n' + // vector to viewer
        '       specular = pow(specAngle, Kshiny);}\n' + // vector to viewer

        '  gl_FragColor = vec4(emissive+ ambient + diffuse + specular*u_Is*u_MatlSet[0].spec*v_Color.rgb + 0.0*Ks, 1.0);\n'
        + '}\n';

    var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    // for surface normals:
    var sq23 = Math.sqrt(2.0 / 3.0)
    var sq29 = Math.sqrt(2.0 / 9.0)
    var sq89 = Math.sqrt(8.0 / 9.0)
    var thrd = 1.0 / 3.0;
    makeSphere1();
    makeStarterShapes();
    this.vboVerts = (starterShapes.length + sphVerts1.length) / 10;

    this.vboContents = new Float32Array(starterShapes.length + sphVerts1.length);
    //this.vboContents = starterShapes;

    for (i = 0, j = 0; j < starterShapes.length; i++, j++) {
        this.vboContents[i] = starterShapes[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts1.length; i++, j++) {// don't initialize i -- reuse it!
        this.vboContents[i] = sphVerts1[j];
    }

    // # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
    // bytes req'd by 1 vboContents array element;
    // (why? used to compute stride and offset 
    // in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;
    // (#  of floats in vboContents array) * 
    // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;
    // (== # of bytes to store one complete vertex).
    // From any attrib in a given vertex in the VBO, 
    // move forward by 'vboStride' bytes to arrive 
    // at the same attrib for the next vertex.

    //----------------------Attribute sizes
    this.vboFcount_a_Position = 4;    // # of floats in the VBO needed to store the
    // attribute named a_Position. (4: x,y,z,w values)
    this.vboFcount_a_Color = 3;   // # of floats for this attrib (r,g,b values)
    this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
    console.assert((this.vboFcount_a_Position +     // check the size of each and
        this.vboFcount_a_Color +
        this.vboFcount_a_Normal) *   // every attribute in our VBO
        this.FSIZE == this.vboStride, // for agreeement with'stride'
        "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");

    //----------------------Attribute offsets
    this.vboOffset_a_Position = 0;    //# of bytes from START of vbo to the START
    // of 1st a_Position attrib value in vboContents[]
    this.vboOffset_a_Color = (this.vboFcount_a_Position) * this.FSIZE;
    // == 4 floats * bytes/float
    //# of bytes from START of vbo to the START
    // of 1st a_Color attrib value in vboContents[]
    this.vboOffset_a_Normal = (this.vboFcount_a_Position +
        this.vboFcount_a_Color) * this.FSIZE;
    // == 7 floats * bytes/float
    // # of bytes from START of vbo to the START
    // of 1st a_PtSize attrib value in vboContents[]

    //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    // set by compile/link of VERT_SRC and FRAG_SRC.
    //------Attribute locations in our shaders:
    this.a_PositionLoc;							  // GPU location: shader 'a_Position' attribute
    this.a_ColorLoc;							// GPU location: shader 'a_Color' attribute
    this.a_NormalLoc;							// GPU location: shader 'a_PtSiz1' attribute

    //---------------------- Uniform locations &values in our shaders
    this.MvpMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.u_MvpMatrixLoc;						// GPU location for u_ModelMat uniform

    this.ModelMatrix = new Matrix4();
    this.u_ModelMatrixLoc;

    this.NormalMatrix = new Matrix4();
    this.u_NormalMatrixLoc;


};


VBObox5.prototype.init = function () {
    //==============================================================================
    // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
    // kept in this VBObox. (This function usually called only once, within main()).
    // Specifically:
    // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
    //  executable 'program' stored and ready to use inside the GPU.  
    // b) create a new VBO object in GPU memory and fill it by transferring in all
    //  the vertex data held in our Float32array member 'VBOcontents'. 
    // c) Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
    // -------------------
    // CAREFUL!  before you can draw pictures using this VBObox contents, 
    //  you must call this VBObox object's switchToMe() function too!
    //--------------------
    // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
        console.log(this.constructor.name +
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
    // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
    //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

    // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();
    if (!this.vboLoc) {
        console.log(this.constructor.name +
            '.init() failed to create VBO in GPU. Bye!');
        return;
    }

    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
        this.vboLoc);				  // the ID# the GPU uses for this buffer.

    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
        this.vboContents, 		// JavaScript Float32Array
        gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    // c1) Find All Attributes:-----------------------------------------------------
    //  Find & save the GPU location of all our shaders' attribute-variables and 
    //  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
    this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if (this.a_PositionLoc < 0) {
        console.log(this.constructor.name +
            '.init() Failed to get GPU location of attribute a_Position');
        return -1;	// error exit.
    }

    this.a_ColorLoc = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if (this.a_ColorLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Color');
        return -1;	// error exit.
    }

    this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if (this.a_NormalLoc < 0) {
        console.log(this.constructor.name +
            '.init() failed to get the GPU location of attribute a_Normal');
        return -1;	// error exit.
    }
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    if (!this.u_MvpMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_MvpMatrix uniform');
        return;
    }

    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_ModelMatrix uniform');
        return;
    }

    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if (!this.u_NormalMatrixLoc) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_NormalMatrix uniform');
        return;
    }

    this.u_LightPosition = gl.getUniformLocation(this.shaderLoc, 'u_LightPosition');
    if (!this.u_LightPosition) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_LightPosition uniform');
        return;
    }


    this.u_eyePosWorld = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    if (!this.u_eyePosWorld) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_eyePosWorld uniform');
        return;
    }

    this.u_Ia = gl.getUniformLocation(this.shaderLoc, 'u_Ia');
    if (!this.u_Ia) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Ia uniform');
        return;
    }
    this.u_Ka = gl.getUniformLocation(this.shaderLoc, 'u_Ka');
    if (!this.u_Ka) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Ka uniform');
        return;
    }
    this.u_Id = gl.getUniformLocation(this.shaderLoc, 'u_Id');
    if (!this.u_Id) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Id uniform');
        return;
    }
    this.u_Is = gl.getUniformLocation(this.shaderLoc, 'u_Is');
    if (!this.u_Is) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Is uniform');
        return;
    }
    this.u_Kd = gl.getUniformLocation(this.shaderLoc, 'u_Kd');
    if (!this.u_Kd) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Kd uniform');
        return;
    }
    this.u_Ks = gl.getUniformLocation(this.shaderLoc, 'u_Ks');
    if (!this.u_Ks) {
        console.log(this.constructor.name +
            '.init() failed to get GPU location for u_Ks uniform');
        return;
    }

    myMatl.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet[0].emit');
    myMatl.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet[0].ambi');
    myMatl.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet[0].diff');
    myMatl.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet[0].spec');
    myMatl.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet[0].shiny');
    if (!myMatl.uLoc_Ke || !myMatl.uLoc_Ka || !myMatl.uLoc_Kd
        || !myMatl.uLoc_Ks || !myMatl.uLoc_Kshiny
    ) {
        console.log('Failed to get GPUs Reflectance storage locations');
        return;
    }


}

VBObox5.prototype.switchToMe = function () {
    //==============================================================================
    // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
    //
    // We only do this AFTER we called the init() function, which does the one-time-
    // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
    // even then, you are STILL not ready to draw our VBObox's contents onscreen!
    // We must also first complete these steps:
    //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
    //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
    //  c) tell the GPU to connect the shader program's attributes to that VBO.

    // a) select our shader program:
    gl.useProgram(this.shaderLoc);
    //		Each call to useProgram() selects a shader program from the GPU memory,
    // but that's all -- it does nothing else!  Any previously used shader program's 
    // connections to attributes and uniforms are now invalid, and thus we must now
    // establish new connections between our shader program's attributes and the VBO
    // we wish to use.  

    // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
    //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
    //    supply values to use as attributes in our newly-selected shader program:
    gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
        this.vboLoc);			// the ID# the GPU uses for our VBO.

    // c) connect our newly-bound VBO to supply attribute variable values for each
    // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
    // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
    //		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
        this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
        this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
        gl.FLOAT,		  // type == what data type did we use for those numbers?
        false,				// isNormalized == are these fixed-point values that we need
        //									normalize before use? true or false
        this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
        // stored attrib for this vertex to the same stored attrib
        //  for the next vertex in our VBO.  This is usually the 
        // number of bytes used to store one complete vertex.  If set 
        // to zero, the GPU gets attribute values sequentially from 
        // VBO, starting at 'Offset'.	
        // (Our vertex size in bytes: 4 floats for pos + 3 for color)
        this.vboOffset_a_Position);
    // Offset == how many bytes from START of buffer to the first
    // value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_ColorLoc, this.vboFcount_a_Color,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Color);
    gl.vertexAttribPointer(this.a_NormalLoc, this.vboFcount_a_Normal,
        gl.FLOAT, false,
        this.vboStride, this.vboOffset_a_Normal);
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_PositionLoc);
    gl.enableVertexAttribArray(this.a_ColorLoc);
    gl.enableVertexAttribArray(this.a_NormalLoc);

}

VBObox5.prototype.isReady = function () {
    //==============================================================================
    // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
    // this objects VBO and shader program; else return false.
    // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

    var isOK = true;

    if (gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc) {
        console.log(this.constructor.name +
            '.isReady() false: shader program at this.shaderLoc not in use!');
        isOK = false;
    }
    if (gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name +
            '.isReady() false: vbo at this.vboLoc not in use!');
        isOK = false;
    }
    return isOK;
}

VBObox5.prototype.adjust = function () {
    //==============================================================================
    // Update the GPU to newer, current values we now store for 'uniform' vars on 
    // the GPU; and (if needed) update each attribute's stride and offset in VBO.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.adjust() call you needed to call this.switchToMe()!!');
    }
    // Adjust values for our uniforms,
    this.ModelMatrix.setIdentity();
    //gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);


    this.MvpMatrix.setIdentity();
    // THIS DOESN'T WORK!!  this.ModelMatrix = g_worldMat;
    this.MvpMatrix.set(g_worldMat);

    // to-do: some transformations to position 3d parts and assemble assemblies
    // for example: 
    // this.MvpMatrix.translate(1, 2, -1);
    // this.MvpMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // this.ModelMatrix.translate(1, 2, -1);
    // this.ModelMatrix.rotate(30.0, 0, 0, 1); // z-axis
    // make sure all subsequent Mvp transforms are also applied to ModelMatrix

    //gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    this.NormalMatrix.setInverseOf(this.ModelMatrix);
    this.NormalMatrix.transpose();
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrix, false, this.ModelMatrix.elements);
    gl.uniformMatrix4fv(this.u_MvpMatrix, false, this.MvpMatrix.elements);

    // Set the light direction (in the world coordinate)
    var xpos = document.getElementById("X").value;
    var ypos = document.getElementById("Y").value;
    var zpos = document.getElementById("Z").value;
    gl.uniform3f(this.u_LightPosition, xpos, ypos, zpos);
    // Set the ambient light
    var ar = document.getElementById("AR").value;
    var ag = document.getElementById("AG").value;
    var ab = document.getElementById("AB").value;
    gl.uniform3f(this.u_Ia, ar, ag, ab);

    gl.uniform3f(this.u_Ka, 0.6, 0.6, 0.6);
    gl.uniform3f(this.u_eyePosWorld, e[0], e[1], e[2]);

    var dr = document.getElementById("DR").value;
    var dg = document.getElementById("DG").value;
    var db = document.getElementById("DB").value;
    gl.uniform3f(this.u_Id, dr, dg, db);

    var sr = document.getElementById("SR").value;
    var sg = document.getElementById("SG").value;
    var sb = document.getElementById("SB").value;
    gl.uniform3f(this.u_Is, sr, sg, sb);
    var dr = document.getElementById("DR").value;
    var dg = document.getElementById("DG").value;
    var db = document.getElementById("DB").value;
    gl.uniform3f(this.u_Id, dr, dg, db);

    var sr = document.getElementById("SR").value;
    var sg = document.getElementById("SG").value;
    var sb = document.getElementById("SB").value;
    gl.uniform3f(this.u_Is, sr, sg, sb);
    gl.uniform3f(this.u_Kd, 0.8, 0.8, 0.8);
    gl.uniform3f(this.u_Ks, 0.8, 0.8, 0.8);

    //---------------For the Material object(s):
    gl.uniform3fv(myMatl.uLoc_Ke, myMatl.K_emit.slice(0, 3));				// Ke emissive
    gl.uniform3fv(myMatl.uLoc_Ka, myMatl.K_ambi.slice(0, 3));				// Ka ambient
    gl.uniform3fv(myMatl.uLoc_Kd, myMatl.K_diff.slice(0, 3));				// Kd	diffuse
    gl.uniform3fv(myMatl.uLoc_Ks, myMatl.K_spec.slice(0, 3));				// Ks specular
    gl.uniform1i(myMatl.uLoc_Kshiny, parseInt(myMatl.K_shiny, 10));     // Kshiny 
    //	== specular exponent; (parseInt() converts from float to base-10 integer).
    // Test our Material object's values:
    //	console.log('matl0.K_emit', matl0.K_emit.slice(0,3), '\n');
    //	console.log('matl0.uLoc_Ke', matl0.uLoc_Ke, '\n'); //


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);
}

VBObox5.prototype.draw = function () {
    //=============================================================================
    // Send commands to GPU to select and render current VBObox contents.

    // check: was WebGL context set to use our VBO & shader program?
    if (this.isReady() == false) {
        console.log('ERROR! before' + this.constructor.name +
            '.draw() call you needed to call this.switchToMe()!!');
    }

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 200.0;



    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    //this.NormalMatrix.setIdentity();
    this.MvpMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.NormalMatrix.rotate(g_angleNow2, 0, 0, 1);	// -spin drawing axes,
    this.ModelMatrix.rotate(g_angleNow2, 0, 0, 1);



    this.MvpMatrix.translate(1.0, 0.0, 1);						// then translate them.
    this.ModelMatrix.translate(1.0, 0.0, 1);
    this.NormalMatrix.translate(1.0, 0.0, 1);						// then translate them.
    // this.NormalMatrix.translate(2,0,0);


    this.MvpMatrix.translate(2, 4, 0);
    this.ModelMatrix.translate(2, 4, 0);
    this.NormalMatrix.translate(2, 4, 0);


    //  Transfer new uniforms' values to the GPU:-------------
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.
    // ----------------------------Draw the contents of the currently-bound VBO:
    gl.drawArrays(gl.TRIANGLES,		    // select the drawing primitive to draw:
        // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
        //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
        0, 								// location of 1st vertex to draw;
        12);		// number of vertices to draw on-screen.


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(2, -4, 0);
    this.NormalMatrix.translate(2, -4, 0);
    this.ModelMatrix.translate(2, -4, 0);

    this.MvpMatrix.rotate(90, 1, 0.0, 0);
    this.NormalMatrix.rotate(90, 1, 0.0, 0);
    this.ModelMatrix.rotate(90, 1, 0.0, 0);

    this.MvpMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(g_angleNow1, 0, 0.0, 1);



    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);


    this.MvpMatrix.translate(0, 2.8, 0);
    this.NormalMatrix.translate(0, 2.8, 0);
    this.ModelMatrix.translate(0, 2.8, 0);

    this.MvpMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.NormalMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    this.ModelMatrix.rotate(40 + g_angleNow1, 0, 0.0, 1);
    //this.ModelMatrix.rotate(g_angle02, 0, 0, 1);

    //this.NormalMatrix.rotate(g_angle02, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 24, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 32, 4);

    this.MvpMatrix.rotate(90, 0, 1, 0);
    this.NormalMatrix.rotate(90, 0, 1, 0);
    this.ModelMatrix.rotate(90, 0, 1, 0);

    this.MvpMatrix.translate(0, 2.8, -0.5);
    this.NormalMatrix.translate(0, 2.8, -0.5);
    this.ModelMatrix.translate(0, 2.8, -0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_FAN, 36, 8);
    gl.drawArrays(gl.TRIANGLE_FAN, 44, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 52, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 56, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 60, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 64, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 68, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 72, 4);


    this.ModelMatrix = popMatrix();
    this.NormalMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);


    this.MvpMatrix.scale(2, 2, 2);
    this.NormalMatrix.scale(2, 2, 2);
    this.ModelMatrix.scale(2, 2, 2);

    this.MvpMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.NormalMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);
    this.ModelMatrix.rotate(0.5 * g_angleNow2, 0, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //this is where we would set the material I think but I am really confused about that... how do we prevent the material from being
    //applied to all objects in the VBObox?
    //Honestly considering reaching out to someone else in the class
    // gl.uniform3fv(u_KeLoc?CHECKTHIS, matl0.K_emit.slice(0, 3));				// Ke emissive
    // gl.uniform3fv(u_KaLoc?, matl0.K_ambi.slice(0, 3));				// Ka ambient
    // gl.uniform3fv(u_KdLoc?, matl0.K_diff.slice(0, 3));				// Kd	diffuse
    // gl.uniform3fv(u_KsLoc?, matl0.K_spec.slice(0, 3));				// Ks specular
    // gl.uniform1i(KshinyLoc?, parseInt(matl0.K_shiny, 10));     // Kshiny

    gl.drawArrays(gl.TRIANGLE_STRIP, 132, this.vboVerts - 132);
    //triangle fan 36, 5, fan 41, 5, fan 46, 5, fan 51, 5, triangle strip 56, 4

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.NormalMatrix);
    pushMatrix(this.ModelMatrix);

    this.MvpMatrix.translate(0, 2.8, 0.5);
    this.ModelMatrix.translate(0, 2.8, 0.5);
    this.NormalMatrix.translate(0, 2.8, 0.5);

    this.MvpMatrix.rotate(90, 1, 0, 0);
    this.ModelMatrix.rotate(90, 1, 0, 0);
    this.NormalMatrix.rotate(90, 1, 0, 0);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw Book binding and covers
    gl.drawArrays(gl.TRIANGLE_STRIP, 76, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 80, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 84, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 88, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 92, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 96, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 100, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 104, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 108, 4);


    this.MvpMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1 - 40, 0, 0, 1);


    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw page
    gl.drawArrays(gl.TRIANGLE_STRIP, 112, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    this.MvpMatrix = popMatrix();

    pushMatrix(this.MvpMatrix);
    pushMatrix(this.ModelMatrix);
    pushMatrix(this.NormalMatrix);

    this.MvpMatrix.translate(0, 5, 0.5);
    this.ModelMatrix.translate(0, 5, 0.5);
    this.NormalMatrix.translate(0, 5, 0.5);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    //draw laptop
    gl.drawArrays(gl.TRIANGLE_STRIP, 136, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 140, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 144, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 148, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 152, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 156, 4);

    this.MvpMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.ModelMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);
    this.NormalMatrix.rotate(g_angleNow1, g_angleNow1, 0, 1);

    gl.uniformMatrix4fv(this.u_MvpMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.MvpMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_NormalMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.NormalMatrix.elements);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
        false, 										// use matrix transpose instead?
        this.ModelMatrix.elements);	// send data from Javascript.

    gl.drawArrays(gl.TRIANGLE_STRIP, 116, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 120, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 124, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 128, 4);
    gl.drawArrays(gl.TRIANGLE_STRIP, 132, 4);

    this.NormalMatrix = popMatrix();
    this.ModelMatrix = popMatrix();
    //this.MvpMatrix.scale(2, 2, 2);

}


VBObox5.prototype.reload = function () {
    //=============================================================================
    // Over-write current values in the GPU for our already-created VBO: use 
    // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
    // contents to our VBO without changing any GPU memory allocations.

    gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
        0,                  // byte offset to where data replacement
        // begins in the VBO.
        this.vboContents);   // the JS source-data array used to fill VBO
}