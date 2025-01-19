#version 300 es

precision highp float;

in vec2 v_uv;
in vec3 v_rayPosition;
in vec3 v_rayDirection;

out vec4 outColor;

struct Ray { vec3 p; vec3 dir; };

vec3 checkerBoardTexture(vec2 uv) {
	// ^^ means xor
	return fract(uv.x) > 0.5 ^^ fract(uv.y) > 0.5
		? vec3(0.2)  // dark grey
		: vec3(1.0); // white
}

vec3 sky(vec3 dir) {
	vec3 horizonColor = vec3(0.573, 0.922, 0.988);
	vec3 zenithColor =  vec3(0.129, 0.141, 0.859);
	vec3 groundColor =  vec3(0.201, 0.150, 0.075);
	if (dir.y > 0.0) {
		return mix(horizonColor, zenithColor, clamp(pow(dir.y, 0.2), 0.0, 1.0));
	}
	else {
		return mix(horizonColor, groundColor, clamp(pow(-dir.y, 0.1), 0.0, 1.0));
	}
}

void main() {
	Ray ray = Ray(v_rayPosition, normalize(v_rayDirection));

	outColor = vec4(sky(ray.dir), 1.0);

	// ground plane
	float t = (-ray.p.y) / (ray.dir.y);
	if (t > 0.0) {
		vec3 hitpoint = ray.p + t * ray.dir;
		outColor.xyz = checkerBoardTexture(hitpoint.xz);
	}
}
