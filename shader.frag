#version 330 core
out vec4 FragColor;
in vec2 fragCoord;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform float u_max_iterations;
uniform vec2 u_julia;

vec2 mapCorner2 = vec2(-0.4, -0.4);
vec2 mapCorner1 = vec2(-1.0, -1.0);
vec2 mapCenter = (mapCorner1 + mapCorner2) / 2;
float mapBorderSize = 0.001;

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
        vec4 color = 0.25 * (iterToColor(iters1) + iterToColor(iters2) + iterToColor(iters3) + iterToColor(iters4));
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
        vec4 color = 0.25 * (iterToColor2(iters1) + iterToColor2(iters2) + iterToColor2(iters3) + iterToColor2(iters4));
        FragColor = color;
    }
}