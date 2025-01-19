#version 300 es

precision highp float;

in vec3 v_rayPosition;
in vec3 v_rayDirection;

out vec4 outColor;

// scene data
const vec3 lightDirection = normalize(vec3(0.3, 1, 0.3));
const vec3 spherePos = vec3(0,1,0);
const float sphereRadius = 1.0;

struct Ray { vec3 p; vec3 dir; };
struct Intersection { vec3 p; vec3 n; };
struct Material { // factors should add up to 1.0
	float diffuseFactor;
	float reflectionFactor;
	float refractionFactor;
	vec3 albedoColor;
};
struct ObjectIntersection {
	Intersection intersection;
	Material material;
};

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
		? vec3(0.3)  // dark grey
		: vec3(0.9); // white
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

bool intersectGround(Ray ray, out Intersection intersection) {
	float t = (-ray.p.y) / (ray.dir.y);
	if (t <= 0.0) {
		return false;
	}
	intersection.p = ray.p + t * ray.dir;
	if (abs(intersection.p.x) > 2.5 || abs(intersection.p.z) > 2.5) {
		return false;
	}
	intersection.n = vec3(0, ray.p.y > 0.0 ? 1 : -1, 0);
	return true;
}

bool intersectSphere(Ray ray, vec3 center, float radius, out Intersection intersection) {
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

	intersection.p = ray.p + t * ray.dir;
	intersection.n = normalize(intersection.p - center); // normal pointing outward
	// flip normal if the ray is coming from inside
	if (dot(ray.dir, intersection.n) > 0.0) {
		intersection.n = -intersection.n;
	}
	return true;
}

bool traceMin(Ray ray) {
	Intersection intersection;
	return intersectGround(ray, intersection)
		|| intersectSphere(ray, spherePos, sphereRadius, intersection);
}

bool trace(Ray ray, out ObjectIntersection o) {
	ObjectIntersection[2] intersections;
	int intersectionsSize = 0;

	// intersect ground
	Intersection groundIntersection;
	bool isGroundHit = intersectGround(ray, groundIntersection);
	if (isGroundHit) {
		intersections[intersectionsSize] = ObjectIntersection(
			groundIntersection,
			Material(
				1.0, 0.0, 0.0, 
				checkerBoardTexture(groundIntersection.p.xz)
			)
		);
		intersectionsSize++;
	}

	// intersect sphere
	Intersection sphereIntersection;
	bool isSphereHit = intersectSphere(ray, spherePos, sphereRadius, sphereIntersection);
	if (isSphereHit) {
		intersections[intersectionsSize] = ObjectIntersection(
			sphereIntersection,
			Material(
				1.0, 0.0, 0.0,
				checkerBoardTexture(sphereMapUV(sphereIntersection.p - spherePos) * 5.0)
			)
		);
		intersectionsSize++;
	}

	int closestIndex;
	const float MAX_DIST = 1000000.0;
	float closestDistance = MAX_DIST;
	for (int i = 0; i < intersectionsSize; i++) {
		float d = distance(intersections[i].intersection.p, ray.p);
		if (d < closestDistance) {
			closestIndex = i;
			closestDistance = d;
		}
	}

	if (closestDistance >= MAX_DIST) {
		return false; // no intersection
	}
	else {
		o = intersections[closestIndex];
		return true;
	}
}

vec3 shade(vec3 albedo, float occlusion, vec3 normal) {
	float diffuse = max(0.0, dot(normal, lightDirection)) * mix(1.0, 0.0, occlusion);
	float ambient = 0.4;
	return (diffuse + ambient) * albedo;
}

void main() {
	Ray ray = Ray(v_rayPosition, normalize(v_rayDirection));

	outColor.w = 1.0;
	// draw closest object
	ObjectIntersection closest;
	if (trace(ray, closest)) {
		Ray shadowRay = Ray(closest.intersection.p, lightDirection);
		shadowRay.p += shadowRay.dir * 0.0001; // fix wrong self shadowing
		bool isShadowed = traceMin(shadowRay);
		outColor.xyz = shade(
			closest.material.albedoColor, float(isShadowed), closest.intersection.n
		) * closest.material.diffuseFactor;
	}
	else {
		// draw sky
		outColor.xyz = sky(ray.dir);
	}
}
