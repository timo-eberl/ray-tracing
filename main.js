async function main() {
	await initialize();
	requestAnimationFrame(render);
}

// this data is set in initialize() and used in render()
let gl;
let program;
let vao;
let uniformModelMatrixLocation;
let uniformViewMatrixLocation;
let uniformProjectionMatrixLocation;
let uniformAspectRatioLocation;
let uniformCameraRotationLocation;
let uniformCameraDistanceLocation;

let cameraDistance = 5;
let cameraRotation = { x: 15, y: 30 };
let isMouseDown = false;

function setupCameraControls() {
	const canvas = document.querySelector("canvas");
	// set isMouseDown to true if mouse button 0 is pressed while the cursor is on the canvas
	canvas.onmousedown = function(event) { if(event.button === 0) {isMouseDown = true} };
	// set isMosueDown to false if mouse button 0 is released (no matter where the cursor is)
	document.onmouseup = function(event) { if(event.button === 0) {isMouseDown = false} };
	// update the camera rotation when the mouse is moved
	document.onmousemove = function(event) {
		if (isMouseDown) {
			cameraRotation.x += event.movementY * 0.2;
			cameraRotation.y += event.movementX * 0.2;
		}
	};
	// zoom with mouse wheel
	canvas.onwheel = function (event) {
		let delta = event.wheelDeltaY / 120.0; // [-1;1]
		delta *= -0.08;
		delta += 1.0; // [0.9 - 1.1]
		cameraDistance *= delta;
	}
}

async function initialize() {
	setupCameraControls();

	const canvas = document.querySelector("canvas"); // get the html canvas element
	// everytime we talk to WebGL we use this object
	gl = canvas.getContext("webgl2", { alpha: false });

	if (!gl) { console.error("Your browser does not support WebGL2"); }
	// set the resolution of the html canvas element
	canvas.width = 500; canvas.height = 350;

	// set the resolution of the framebuffer
	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.enable(gl.DEPTH_TEST); // enable z-buffering
	gl.enable(gl.CULL_FACE); // enable back-face culling

	// loadTextResource returns a string that contains the content of a text file
	const vertexShaderText = await loadTextResource("shader.vert");
	const fragmentShaderText = await loadTextResource("shader.frag");
	// compile GLSL shaders - turn shader code into machine code that the GPU understands
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);
	// link the two shaders - create a program that uses both shaders
	program = createProgram(gl, vertexShader, fragmentShader);

	uploadAttributeData();

	uniformModelMatrixLocation = gl.getUniformLocation(program, "u_modelMatrix");
	uniformAspectRatioLocation = gl.getUniformLocation(program, "u_aspectRatio");
	uniformCameraRotationLocation = gl.getUniformLocation(program, "u_cameraRotation");
	uniformCameraDistanceLocation = gl.getUniformLocation(program, "u_cameraDistance");
}

function uploadAttributeData() {
	vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const indexBuffer = gl.createBuffer();
	// gl.ELEMENT_ARRAY_BUFFER tells WebGL that this buffer should be treated as an index list
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadMesh.indices), gl.STATIC_DRAW);

	const posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadMesh.positions), gl.STATIC_DRAW);
	const posAttributeLocation = gl.getAttribLocation(program, "a_position");
	gl.vertexAttribPointer(posAttributeLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(posAttributeLocation);

	const uvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadMesh.uvs), gl.STATIC_DRAW);
	const uvAttributeLocation = gl.getAttribLocation(program, "a_uv");
	gl.vertexAttribPointer(uvAttributeLocation, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(uvAttributeLocation);

	// unbind to avoid accidental modification
	gl.bindVertexArray(null); // before other unbinds
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function render(time) {
	gl.clearColor(0, 0, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(program);

	gl.bindVertexArray(vao);

	setUniforms();
	
	const numVertices = quadMesh.indices.length;
	gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_SHORT, 0);

	// unbind to avoid accidental modification
	gl.bindVertexArray(vao);
	gl.useProgram(null);

	requestAnimationFrame(render);
}

function setUniforms() {
	// use row-major notation (like in maths)
	const modelMatrix = [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1,
	];

	const vT = mat4Translation(0,0,-cameraDistance);
	const vRy = mat4RotY(cameraRotation.y * Math.PI / 180);
	const vRx = mat4RotX(cameraRotation.x * Math.PI / 180);
	const viewMatrix = mat4Mul(vT, mat4Mul(vRx, vRy));

	// we set transpose to true to convert to column-major
	gl.uniformMatrix4fv(uniformModelMatrixLocation, true, modelMatrix);

	const canvas = document.querySelector("canvas");
	const aspectRatio = canvas.width / canvas.height;

	gl.uniform1fv(uniformAspectRatioLocation, [ aspectRatio ]);
	gl.uniform2fv(uniformCameraRotationLocation, [
		cameraRotation.x  * Math.PI / 180, cameraRotation.y  * Math.PI / 180
	]);
	gl.uniform1fv(uniformCameraDistanceLocation, [ cameraDistance ]);
}

main();
