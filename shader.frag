#version 300 es

precision highp float;

in vec2 v_uv;
in vec3 v_rayPosition;
in vec3 v_rayDirection;

out vec4 outColor;

struct Ray { vec3 p; vec3 dir; };

float longitudeFromDirection(vec3 dir) {
	return atan(-dir.z, dir.x) + 3.141; // [0;2pi]
}

float latitudeFromDirection(vec3 dir) {
	// [-pi/2;pi/2]
	// -pi/2 means 90° south
	//  pi/2 means 90° north
	return atan(dir.y, length(dir.xz));
}

vec2 sphereMapUV(vec3 position) {
	vec3 dir = normalize(position);
	float longitude = longitudeFromDirection(dir);
	float latitude = latitudeFromDirection(dir);

	float u = (longitude / 3.141) * 0.5; // [0;1]
	float v = (latitude / (3.141*0.5)) * 0.5 + 0.5; // [0;1]

	return vec2(u, v);
}

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

bool intersectGround(Ray ray, out vec3 hitpoint) {
	float t = (-ray.p.y) / (ray.dir.y);
	if (t < 0.0) {
		return false;
	}
	hitpoint = ray.p + t * ray.dir;
	return true;
}

bool intersectSphere(Ray ray, vec3 center, float radius, out vec3 hitpoint) {
	// ray origin to sphere center
	vec3 oc = ray.p - center;

	// coefficients of the quadratic equation
	float a = dot(ray.dir, ray.dir);
	float b = 2.0 * dot(oc, ray.dir);
	float c = dot(oc, oc) - radius * radius;

	float discriminant = b * b - 4.0 * a * c;

	// if the discriminant is negative, there is no intersection
	if (discriminant < 0.0) {
		return false;
	}

	// compute the two possible solutions for t
	float sqrtDiscriminant = sqrt(discriminant);
	float t0 = (-b - sqrtDiscriminant) / (2.0 * a);
	float t1 = (-b + sqrtDiscriminant) / (2.0 * a);

	// we take the smallest positive t value
	float t = (t0 > 0.0) ? t0 : t1;
	if (t <= 0.0) {
		return false;
	}

	hitpoint = ray.p + t * ray.dir;
	return true;
}

void main() {
	Ray ray = Ray(v_rayPosition, normalize(v_rayDirection));

	// draw sky
	outColor = vec4(sky(ray.dir), 1.0);

	// draw ground
	vec3 groundIntersection;
	if (intersectGround(ray, groundIntersection)) {
		outColor.xyz = checkerBoardTexture(groundIntersection.xz);
	}

	// hack that only works for this scene:
	// do not draw sphere if camera is below ground
	if (ray.p.y < 0.0) return;

	// draw sphere
	vec3 sphereIntersection;
	vec3 spherePos = vec3(0,1,0);
	if (intersectSphere(ray, spherePos, 1.0, sphereIntersection)) {
		vec2 uv = sphereMapUV(sphereIntersection - spherePos);
		outColor.xyz = checkerBoardTexture(uv * 5.0);
	}
}
