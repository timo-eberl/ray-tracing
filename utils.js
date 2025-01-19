function createShader(gl, type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	switch (type) {
		case gl.VERTEX_SHADER:
			console.error("VERTEX SHADER " + gl.getShaderInfoLog(shader));
			break;
		case gl.FRAGMENT_SHADER:
			console.error("FRAGMENT SHADER " + gl.getShaderInfoLog(shader));
			break;
		default:
			console.error(gl.getShaderInfoLog(shader));
			break;
	}
	gl.deleteShader(shader);
	return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	const success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.error(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
	return undefined;
}

function loadTextResource(url) {
	return new Promise(function (resolve, reject) {
		let request = new XMLHttpRequest();
		// add a query string with random content, otherwise the browser may cache the file and not reload properly
		request.open("GET", url + "?please-dont-cache=" + Math.random(), true);
		request.onload = function () {
			if (request.status === 200) {
				resolve(request.responseText);
			}
			else {
				reject("Error: HTTP Status " + request.status + " on resource " + url);
			}
		}
		request.send();
	});
}
