#version 300 es

precision highp float;

in vec3 v_rayPosition;
in vec3 v_rayDirection;

out vec4 outColor;

struct Ray { vec3 p; vec3 dir; };
struct Intersection { vec3 p; vec3 n; };
struct Material { // factors should add up to 1.0
	float diffuseFactor;
	float reflectionFactor;
	float refractionFactor;
	float refractiveIndex;
	vec3 albedoColor;
};
struct ObjectIntersection {
	Intersection intersection;
	Material material;
};

// scene data
const vec3 lightDirection = normalize(vec3(0.3, 1, 0.3));
const vec3 sphere1Pos = vec3(-1.0,1,1);
const vec3 sphere2Pos = vec3( 1.0,1,1);
const vec3 sphere3Pos = vec3(-1.0,1,-1);
const vec3 sphere4Pos = vec3( 1.0,1,-1);
const float sphereRadius = 0.85;
const Material groundMaterial = Material(
	1.0, 0.0, 0.0, // diff refl refr
	1.0, // refractive index
	vec3(1.0)
);
const Material sphere1Material = Material(
	0.0, 0.2, 0.8, // diff refl refr
	1.3, // refractive index
	vec3(0.3)
);
const Material sphere2Material = Material(
	0.0, 1.0, 0.0, // diff refl refr
	1.3, // refractive index
	vec3(0.3)
);
const Material sphere3Material = Material(
	1.0, 0.0, 0.0, // diff refl refr
	1.3, // refractive index
	vec3(0.5,0,0.1)
);
const Material sphere4Material = Material(
	0.8, 0.2, 0.0, // diff refl refr
	1.3, // refractive index
	vec3(0.5,0.5,0.3)
);

vec3 checkerBoardTexture(vec2 uv) {
	// ^^ means xor
	return fract(uv.x) > 0.5 ^^ fract(uv.y) > 0.5
		? vec3(0.2)  // dark grey
		: vec3(0.6); // bright grey
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
		|| intersectSphere(ray, sphere1Pos, sphereRadius, intersection)
		|| intersectSphere(ray, sphere2Pos, sphereRadius, intersection)
		|| intersectSphere(ray, sphere3Pos, sphereRadius, intersection)
		|| intersectSphere(ray, sphere4Pos, sphereRadius, intersection);
}

bool trace(Ray ray, out ObjectIntersection closestObject) {
	const float MAX_DIST = 1000000.0;
	float closestDistance = MAX_DIST;

	Intersection intersection;
	// ground
	if (intersectGround(ray, intersection)) {
		float d = distance(intersection.p, ray.p);
		if (d < closestDistance) {
			closestObject = ObjectIntersection(
				intersection,
				groundMaterial
			);
			closestObject.material.albedoColor = checkerBoardTexture( intersection.p.xz / 1.75 );
			closestDistance = d;
		}
	}
	// sphere 1
	if (intersectSphere(ray, sphere1Pos, sphereRadius, intersection)) {
		float d = distance(intersection.p, ray.p);
		if (d < closestDistance) {
			closestObject = ObjectIntersection(
				intersection,
				sphere1Material
			);
			closestDistance = d;
		}
	}
	// sphere 2
	if (intersectSphere(ray, sphere2Pos, sphereRadius, intersection)) {
		float d = distance(intersection.p, ray.p);
		if (d < closestDistance) {
			closestObject = ObjectIntersection(
				intersection,
				sphere2Material
			);
			closestDistance = d;
		}
	}
	// sphere 3
	if (intersectSphere(ray, sphere3Pos, sphereRadius, intersection)) {
		float d = distance(intersection.p, ray.p);
		if (d < closestDistance) {
			closestObject = ObjectIntersection(
				intersection,
				sphere3Material
			);
			closestDistance = d;
		}
	}
	// sphere 4
	if (intersectSphere(ray, sphere4Pos, sphereRadius, intersection)) {
		float d = distance(intersection.p, ray.p);
		if (d < closestDistance) {
			closestObject = ObjectIntersection(
				intersection,
				sphere4Material
			);
			closestDistance = d;
		}
	}

	return closestDistance < MAX_DIST; // if closestDistance is the same, there's no intersection
}

vec3 shade(vec3 albedo, float occlusion, vec3 normal) {
	float diffuse = max(0.0, dot(normal, lightDirection)) * mix(1.0, 0.0, occlusion);
	float ambient = 0.5;
	return (diffuse + ambient) * albedo;
}

struct LightRay { Ray ray; float contribution; };

const float minContribution = 0.01;

void main() {
	const int lightRaysMaxSize = 15;
	LightRay[lightRaysMaxSize] lightRays;
	int lightRaysSize = 0;
	// primary ray
	lightRays[lightRaysSize] = LightRay( Ray(v_rayPosition, normalize(v_rayDirection)), 1.0 );
	lightRaysSize++;

	outColor = vec4(0,0,0,1);

	for (int j = 0; j < lightRaysSize; j++) {
		if (lightRays[j].contribution < minContribution) continue;

		float contribution = lightRays[j].contribution;
		Ray ray = lightRays[j].ray;

		ObjectIntersection closest;
		// intersection found: draw closest object
		if (trace(ray, closest)) {
			// diffuse shading
			if (closest.material.diffuseFactor > 0.0) {
				Ray shadowRay = Ray(closest.intersection.p, lightDirection);
				shadowRay.p += shadowRay.dir * 0.0001; // fix wrong self occlusion
				bool isShadowed = traceMin(shadowRay);
				outColor.xyz += shade(
					closest.material.albedoColor, float(isShadowed), closest.intersection.n
				) * closest.material.diffuseFactor * contribution;
			}
			// reflection
			if (closest.material.reflectionFactor > 0.0 && lightRaysSize < lightRaysMaxSize) {
				Ray newRay = Ray(closest.intersection.p, reflect(ray.dir, closest.intersection.n));
				newRay.p += newRay.dir * 0.0001; // fix wrong self occlusion
				float newContribution = contribution * closest.material.reflectionFactor;
				lightRays[lightRaysSize] = LightRay(newRay, newContribution);
				lightRaysSize++;
			}
			// refraction
			if (closest.material.refractionFactor > 0.0 && lightRaysSize < lightRaysMaxSize) {
				float eta = 1.0 / closest.material.refractiveIndex;
				Ray newRay = Ray(closest.intersection.p, refract(ray.dir, closest.intersection.n, eta));
				newRay.p += newRay.dir * 0.0001; // fix wrong self occlusion
				float newContribution = contribution * closest.material.refractionFactor;
				lightRays[lightRaysSize] = LightRay(newRay, newContribution);
				lightRaysSize++;
			}
		}
		// no intersection found: draw sky
		else {
			outColor.xyz += sky(ray.dir) * contribution;
		}
	}
}
