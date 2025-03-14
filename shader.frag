#version 330 core
out vec4 FragColor;
in vec2 fragCoord;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform float u_max_iterations;
uniform vec2 u_julia;

const vec2 mapCorner2 = vec2(-0.4, -0.4);
const vec2 mapCorner1 = vec2(-1.0, -1.0);
const vec2 mapCenter = (mapCorner1 + mapCorner2) / 2;
const float mapBorderSize = 0.001;

// Define the color control points
const vec3 color0 = vec3(0, 7, 100) / 255.0;
const vec3 color1 = vec3(32, 107, 203) / 255.0;
const vec3 color2 = vec3(237, 255, 255) / 255.0;
const vec3 color3 = vec3(255, 170, 0) / 255.0;
const vec3 color4 = vec3(0, 2, 0) / 255.0;

// Define the positions of the control points
const float pos0 = 0.0;
const float pos1 = 0.16;
const float pos2 = 0.42;
const float pos3 = 0.6425;
const float pos4 = 0.8575;

int mandelbrotIterations(vec2 c) {
    vec2 z = vec2(0.0);
    int i;
    for (i = 0; i < u_max_iterations; i++) {
        // if z^2 + c diverges, break
        if (dot(z, z) > 40.0) break;
        // calculate next iteration
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    return i;
}

int julaIterations(vec2 c, vec2 julia) {
    vec2 z = c;
    int i;
    for (i = 0; i < u_max_iterations; i++) {
        // if z^2 + c diverges, break
        if (dot(z, z) > 40.0) break;
        // calculate next iteration
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + julia;
    }
    return i;
}

vec2 fragCoordToComplexJulia(vec2 fragCoord) {
    return fragCoord * u_zoom + u_center;
}

vec4 iterToColor(int iters) {
    if (iters == u_max_iterations) return vec4(0.0, 0.0, 0.0, 1.0);
    float t = float(iters) / u_max_iterations;
    return vec4(t, t, sqrt(t), 1.0);
}

vec4 iterToColor2(int iters) {
    if (iters == u_max_iterations) return vec4(0.0, 0.0, 0.0, 1.0);
    float t = float(iters) / u_max_iterations;
    return vec4(0.6*t, 4 * (t - 1) * -t, sqrt(t), 1.0);
}

vec4 iterToColor3(int iters) {
    if (iters == u_max_iterations) return vec4(0.0, 0.0, 0.0, 1.0); // Inside the Mandelbrot set
    float t = float(iters) / float(u_max_iterations); // Normalize iteration count to [0, 1]

    // Perform linear interpolation based on the value of t
    if (t <= pos0) {
        return vec4(color0, 1.0);
    } else if (t <= pos1) {
        float u = (t - pos0) / (pos1 - pos0);
        return vec4(mix(color0, color1, u), 1.0);
    } else if (t <= pos2) {
        float u = (t - pos1) / (pos2 - pos1);
        return vec4(mix(color1, color2, u), 1.0);
    } else if (t <= pos3) {
        float u = (t - pos2) / (pos3 - pos2);
        return vec4(mix(color2, color3, u), 1.0);
    } else if (t <= pos4) {
        float u = (t - pos3) / (pos4 - pos3);
        return vec4(mix(color3, color4, u), 1.0);
    } else {
        return vec4(color4, 1.0);
    }
}

void main() {
    if (fragCoord.x < mapCorner2.x && fragCoord.y < mapCorner2.y) {
        // draw center
        float distanceFromCenterSquared = dot(fragCoord - mapCenter, fragCoord - mapCenter);
        if (0.00004 < distanceFromCenterSquared && distanceFromCenterSquared < 0.00005) {
            FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            return;
        }

        // draw mandelbrot map
        vec2 fragCoordBottomLeft = (fragCoord - mapCenter) * 4;
        vec2 complexNumber = fragCoordBottomLeft + u_julia;

        // use 4 points to prevent aliasing
        vec2 c1 = complexNumber + 0.25 * vec2(4 / u_resolution.x, 4 / u_resolution.y);
        vec2 c2 = complexNumber - 0.25 * vec2(4 / u_resolution.x, 4 / u_resolution.y);
        vec2 c3 = complexNumber + 0.25 * vec2(4 / u_resolution.x, -4 / u_resolution.y);
        vec2 c4 = complexNumber - 0.25 * vec2(4 / u_resolution.x, -4 / u_resolution.y);

        int iters1 = mandelbrotIterations(c1);
        int iters2 = mandelbrotIterations(c2);
        int iters3 = mandelbrotIterations(c3);
        int iters4 = mandelbrotIterations(c4);

        // average the colors
        vec4 color = 0.25 * (iterToColor3(iters1) + iterToColor3(iters2) + iterToColor3(iters3) + iterToColor3(iters4));
        FragColor = color;
    } else if (fragCoord.x < mapCorner2.x + mapBorderSize && fragCoord.y < mapCorner2.y + mapBorderSize) {
        // draw map border
        FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        vec2 complexNumber = fragCoordToComplexJulia(fragCoord);
        // use 4 points to prevent aliasing
        vec2 c1 = complexNumber + 0.25 * u_zoom * vec2(1 / u_resolution.x, 1/ u_resolution.y);
        vec2 c2 = complexNumber - 0.25 * u_zoom * vec2(1 / u_resolution.x, 1/ u_resolution.y);
        vec2 c3 = complexNumber + 0.25 * u_zoom * vec2(1 / u_resolution.x, -1/ u_resolution.y);
        vec2 c4 = complexNumber - 0.25 * u_zoom * vec2(1 / u_resolution.x, -1/ u_resolution.y);

        int iters1 = julaIterations(c1, u_julia);
        int iters2 = julaIterations(c2, u_julia);
        int iters3 = julaIterations(c3, u_julia);
        int iters4 = julaIterations(c4, u_julia);

        // average the colors
        vec4 color = 0.25 * (iterToColor3(iters1) + iterToColor3(iters2) + iterToColor3(iters3) + iterToColor3(iters4));
        FragColor = color;
    }
}