async function main() {
	await initialize();
	measureFPSLoop();
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
let uniformCameraTargetLocation;

let cameraDistance = 5;
let cameraRotation = { x: 15, y: 0 };
let cameraTarget = { x: 0, y: 1, z: 0 };
let isMouseDown = false;
let frameCount = 0;

function measureFPSLoop() {
	document.querySelector("#fps").textContent = frameCount + " FPS"
	frameCount = 0;
	setTimeout(function () {
		measureFPSLoop();
	}, 1000);
}

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

	// track touch events
	let primaryTouch = { identifier: undefined, x: 0, y:0 };
	let secondaryTouch = { identifier: undefined, x: 0, y: 0 };
	document.ontouchstart = function(event) {
		if (primaryTouch.identifier === undefined) {
			primaryTouch.identifier = event.changedTouches[0].identifier;
			primaryTouch.x = event.changedTouches[0].clientX;
			primaryTouch.y = event.changedTouches[0].clientY;
		}
		else if (secondaryTouch.identifier === undefined) {
			secondaryTouch.identifier = event.changedTouches[0].identifier;
			secondaryTouch.x = event.changedTouches[0].clientX;
			secondaryTouch.y = event.changedTouches[0].clientY;
		}
	};
	function touchend(event) {
		if (primaryTouch.identifier === event.changedTouches[0].identifier) {
			primaryTouch.identifier = undefined;
			if (secondaryTouch.identifier !== undefined) {
				primaryTouch.identifier = secondaryTouch.identifier;
				primaryTouch.x = secondaryTouch.x;
				primaryTouch.y = secondaryTouch.y;
				secondaryTouch.identifier = undefined;
			}
		}
		if (secondaryTouch.identifier === event.changedTouches[0].identifier) {
			secondaryTouch.identifier = undefined;
		}
	}
	// measure touch movements, rotate and zoom accordingly
	document.ontouchend = touchend;
	document.ontouchcancel = touchend;
	document.ontouchmove = function (event) {
		let primaryMovement = { x: 0, y: 0 };
		let secondaryMovement = { x: 0, y: 0 };
		const touches = event.changedTouches;
		// note that sometimes multiple events are generated for one touch point
		for (let i = 0; i < touches.length; i++) {
			const element = touches[i];
			if (primaryTouch.identifier === element.identifier) {
				primaryMovement.x += (element.clientX - primaryTouch.x);
				primaryMovement.y += (element.clientY - primaryTouch.y);
				primaryTouch.x = element.clientX;
				primaryTouch.y = element.clientY;
			}
			else if (secondaryTouch.identifier === element.identifier) {
				secondaryMovement.x += (element.clientX - secondaryTouch.x);
				secondaryMovement.y += (element.clientY - secondaryTouch.y);
				secondaryTouch.x = element.clientX;
				secondaryTouch.y = element.clientY;
			}
		}

		if (primaryMovement.x === 0 && primaryMovement.y === 0
				&& secondaryMovement.x === 0 && secondaryMovement.y === 0) {
			return;
		}

		// one touch point - only rotate
		if (primaryTouch.identifier !== undefined && secondaryTouch.identifier === undefined) {
			cameraRotation.x += primaryMovement.y * 0.2;
			cameraRotation.y += primaryMovement.x * 0.2;
		}
		// two touch points - rotate and zoom
		else if (primaryTouch.identifier !== undefined && secondaryTouch.identifier !== undefined) {
			// rotate
			cameraRotation.x += primaryMovement.y * 0.1;
			cameraRotation.y += primaryMovement.x * 0.1;
			cameraRotation.x += secondaryMovement.y * 0.1;
			cameraRotation.y += secondaryMovement.x * 0.1;

			// 2d vector helper functions
			function dot(a,b) { return a.x * b.x + a.y * b.y; };
			function subtract(a,b) { return { x: a.x - b.x, y: a.y - b.y } };
			function normalize(v) {
				const length = Math.sqrt(v.x*v.x + v.y*v.y);
				return { x: v.x/length, y: v.y/length };
			};

			// zoom
			const primPos = { x: primaryTouch.x, y: primaryTouch.y };
			const secPos = { x: secondaryTouch.x, y: secondaryTouch.y };
			const primToSec = dot(primaryMovement, normalize(subtract(secPos, primPos)));
			const secToPrim = dot(secondaryMovement, normalize(subtract(primPos, secPos)));
			let delta = - primToSec - secToPrim; // negative = zoom out, positive = zoom in
			delta *= -0.002;
			delta += 1.0;
			cameraDistance *= delta;
		}
	};
}

const triangleMesh = {
	positions: [
		// x     y     z
		-1.0,  3.0,  0.0, // 0 - top left
		-1.0, -1.0,  0.0, // 1 - bottom left
		 3.0, -1.0,  0.0, // 2 - bottom right
	],
	uvs: [
		0.0, 2.0,
		0.0, 0.0,
		2.0, 0.0,
	],
	indices: [
		0, 1, 2,
	],
};

async function initialize() {
	setupCameraControls();

	const canvas = document.querySelector("canvas"); // get the html canvas element
	// everytime we talk to WebGL we use this object
	gl = canvas.getContext("webgl2", { alpha: false });

	if (!gl) { console.error("Your browser does not support WebGL2"); }

	window.onresize = function () {
		gl.canvas.width = window.innerWidth;
		gl.canvas.height = window.innerHeight;
		gl.viewport(0, 0, canvas.width, canvas.height);
	};
	window.onresize()

	const vertexShaderText = await loadTextResource("shader.vert");
	const fragmentShaderText = await loadTextResource("shader.frag");
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
	const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);
	program = createProgram(gl, vertexShader, fragmentShader);

	uploadAttributeData();

	uniformModelMatrixLocation = gl.getUniformLocation(program, "u_modelMatrix");
	uniformAspectRatioLocation = gl.getUniformLocation(program, "u_aspectRatio");
	uniformCameraRotationLocation = gl.getUniformLocation(program, "u_cameraRotation");
	uniformCameraDistanceLocation = gl.getUniformLocation(program, "u_cameraDistance");
	uniformCameraTargetLocation = gl.getUniformLocation(program, "u_cameraTarget");
}

function uploadAttributeData() {
	vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	const indexBuffer = gl.createBuffer();
	// gl.ELEMENT_ARRAY_BUFFER tells WebGL that this buffer should be treated as an index list
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleMesh.indices), gl.STATIC_DRAW);

	const posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleMesh.positions), gl.STATIC_DRAW);
	const posAttributeLocation = gl.getAttribLocation(program, "a_position");
	gl.vertexAttribPointer(posAttributeLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(posAttributeLocation);

	const uvBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleMesh.uvs), gl.STATIC_DRAW);
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
	
	const numVertices = triangleMesh.indices.length;
	gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_SHORT, 0);

	// unbind to avoid accidental modification
	gl.bindVertexArray(vao);
	gl.useProgram(null);

	frameCount++;

	requestAnimationFrame(render);
}

function setUniforms() {
	const aspectRatio = gl.canvas.width / gl.canvas.height;

	gl.uniform1fv(uniformAspectRatioLocation, [ aspectRatio ]);
	gl.uniform2fv(uniformCameraRotationLocation, [
		cameraRotation.x  * Math.PI / 180, cameraRotation.y  * Math.PI / 180
	]);
	gl.uniform1fv(uniformCameraDistanceLocation, [ cameraDistance ]);
	gl.uniform3fv(uniformCameraTargetLocation, [ cameraTarget.x, cameraTarget.y, cameraTarget.z ]);
}

main();
