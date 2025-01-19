#version 300 es

in vec3 a_position;
in vec2 a_uv;

uniform float u_aspectRatio;
uniform vec2 u_cameraRotation;
uniform float u_cameraDistance;
uniform vec3 u_cameraTarget;

out vec3 v_rayPosition;
out vec3 v_rayDirection;

// rotation follows the right-hand rule

mat3 mat3_rotate_x(float angle_radians) {
	return transpose(mat3(
		vec3(1.0,                   0.0,                   0.0),
		vec3(0.0,    cos(angle_radians),   -sin(angle_radians)),
		vec3(0.0,    sin(angle_radians),    cos(angle_radians))
	));
}

mat3 mat3_rotate_y(float angle_radians) {
	return transpose(mat3(
		vec3( cos(angle_radians),   0.0,    sin(angle_radians)),
		vec3(                0.0,   1.0,                   0.0),
		vec3(-sin(angle_radians),   0.0,    cos(angle_radians))
	));
}

mat3 mat3_rotate_z(float angle_radians) {
	return transpose(mat3(
		vec3( cos(angle_radians),   -sin(angle_radians),    0.0),
		vec3( sin(angle_radians),    cos(angle_radians),    0.0),
		vec3(                0.0,                   0.0,    1.0)
	));
}

struct Ray { vec3 p; vec3 dir; };

Ray makePerspectiveRay(
		vec2 p_cameraRotation, float p_cameraDistance, float p_aspect, float p_fovY,
		vec2 p_uv
	) {
	// rotate - first x, then y
	mat3 rotation = mat3_rotate_y(-p_cameraRotation.y) * mat3_rotate_x(-p_cameraRotation.x);
	// right-handed, y up
	vec3 forward = rotation * vec3(0, 0,-1);
	vec3 right   = rotation * vec3(1, 0, 0);
	vec3 up      = rotation * vec3(0, 1, 0);
	// scale camera for FoV and focal length
	// our y coordinate system is 2 high, from -1.0 to 1,0
	float focalLength = 2.0 / (2.0 * tan(p_fovY * 0.5));
	// scale vectors; by construction, they are already normalized
	right = right * p_aspect;
	forward = forward * focalLength;
	// center on (0.0) ; make the y range from -1 to 1 and point upwards
	vec2 xy = (p_uv - vec2(0.5)) * vec2(2, 2);
	return Ray(
		rotation * vec3(0,0,p_cameraDistance) + u_cameraTarget,
		forward + xy.x * right + xy.y * up
	);
}

void main() {
	gl_Position = vec4(a_position, 1.0);

	Ray ray = makePerspectiveRay(u_cameraRotation, u_cameraDistance, u_aspectRatio, 45.0, a_uv);
	v_rayPosition = ray.p;
	v_rayDirection = ray.dir;
}
