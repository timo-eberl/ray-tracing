function mat4RotX(angleRadians) {
	const cos = Math.cos(angleRadians);
	const sin = Math.sin(angleRadians);
	return [
		1,   0,    0, 0,
		0, cos, -sin, 0,
		0, sin,  cos, 0,
		0,   0,    0, 1,
	];
}

function mat4RotY(angleRadians) {
	const cos = Math.cos(angleRadians);
	const sin = Math.sin(angleRadians);
	return [
		cos, 0,  sin, 0,
		  0, 1,    0, 0,
		-sin, 0,  cos, 0,
		  0, 0,    0, 1,
	];
}

function mat4RotZ(angleRadians) {
	const cos = Math.cos(angleRadians);
	const sin = Math.sin(angleRadians);
	return [
		cos, -sin, 0, 0,
		sin,  cos, 0, 0,
		  0,    0, 1, 0,
		  0,    0, 0, 1,
	];
}

function mat4Translation(tx, ty, tz) {
	return [
		1, 0, 0, tx,
		0, 1, 0, ty,
		0, 0, 1, tz,
		0, 0, 0,  1,
	];
}

function mat3Mul(a, b) {
	const a00 = a[0 * 3 + 0];
	const a01 = a[0 * 3 + 1];
	const a02 = a[0 * 3 + 2];
	const a10 = a[1 * 3 + 0];
	const a11 = a[1 * 3 + 1];
	const a12 = a[1 * 3 + 2];
	const a20 = a[2 * 3 + 0];
	const a21 = a[2 * 3 + 1];
	const a22 = a[2 * 3 + 2];

	const b00 = b[0 * 3 + 0];
	const b01 = b[0 * 3 + 1];
	const b02 = b[0 * 3 + 2];
	const b10 = b[1 * 3 + 0];
	const b11 = b[1 * 3 + 1];
	const b12 = b[1 * 3 + 2];
	const b20 = b[2 * 3 + 0];
	const b21 = b[2 * 3 + 1];
	const b22 = b[2 * 3 + 2];

	return [
		a00 * b00 + a01 * b10 + a02 * b20,
		a00 * b01 + a01 * b11 + a02 * b21,
		a00 * b02 + a01 * b12 + a02 * b22,

		a10 * b00 + a11 * b10 + a12 * b20,
		a10 * b01 + a11 * b11 + a12 * b21,
		a10 * b02 + a11 * b12 + a12 * b22,

		a20 * b00 + a21 * b10 + a22 * b20,
		a20 * b01 + a21 * b11 + a22 * b21,
		a20 * b02 + a21 * b12 + a22 * b22,
	];
}

function mat4Mul(a, b) {
	const a00 = a[0 * 4 + 0];
	const a01 = a[0 * 4 + 1];
	const a02 = a[0 * 4 + 2];
	const a03 = a[0 * 4 + 3];
	const a10 = a[1 * 4 + 0];
	const a11 = a[1 * 4 + 1];
	const a12 = a[1 * 4 + 2];
	const a13 = a[1 * 4 + 3];
	const a20 = a[2 * 4 + 0];
	const a21 = a[2 * 4 + 1];
	const a22 = a[2 * 4 + 2];
	const a23 = a[2 * 4 + 3];
	const a30 = a[3 * 4 + 0];
	const a31 = a[3 * 4 + 1];
	const a32 = a[3 * 4 + 2];
	const a33 = a[3 * 4 + 3];

	const b00 = b[0 * 4 + 0];
	const b01 = b[0 * 4 + 1];
	const b02 = b[0 * 4 + 2];
	const b03 = b[0 * 4 + 3];
	const b10 = b[1 * 4 + 0];
	const b11 = b[1 * 4 + 1];
	const b12 = b[1 * 4 + 2];
	const b13 = b[1 * 4 + 3];
	const b20 = b[2 * 4 + 0];
	const b21 = b[2 * 4 + 1];
	const b22 = b[2 * 4 + 2];
	const b23 = b[2 * 4 + 3];
	const b30 = b[3 * 4 + 0];
	const b31 = b[3 * 4 + 1];
	const b32 = b[3 * 4 + 2];
	const b33 = b[3 * 4 + 3];

	return [
		a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
		a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
		a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
		a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,

		a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
		a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
		a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
		a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,

		a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
		a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
		a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
		a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,

		a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
		a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
		a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
		a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33,
	];
}

function perspective(fieldOfView, aspectRatio, nearClippingPlane, farClippingPlane) {
	// https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/opengl-perspective-projection-matrix.html
	const top = Math.tan(fieldOfView * 0.5 * Math.PI / 180.0) * nearClippingPlane;
	const bottom = -top;
	const right = aspectRatio * top;
	const left = -right;
	const n = nearClippingPlane;
	const f = farClippingPlane;

	const m00 = (2*n) / (right - left);
	const m02 = (right + left) / (right - left);
	const m11 = (2*n) / (top - bottom);
	const m12 = (top + bottom) / (top - bottom);
	const m22 = -(f+n) / (f-n);
	const m23 = -(2*f*n) / (f-n);
	const m32 = -1;

	return [
		m00,   0, m02,   0,
		  0, m11, m12,   0,
		  0,   0, m22, m23,
		  0,   0, m32,   0,
	];
}
