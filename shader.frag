#version 330 core
out vec4 FragColor;
in vec2 fragCoord;

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;

int mandelbrotIterations(vec2 c) {
    vec2 z = vec2(0.0);
    int i;
    for (i = 0; i < 256; i++) {
        // if z^2 + c diverges, break
        if (dot(z, z) > 40.0) break;
        // calculate next iteration
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    return i;
}

vec2 fragCoordToComplex(vec2 fragCoord) {
    return fragCoord * u_zoom + u_center;
}

vec4 iterToColor(int iters) {
    if (iters == 256) return vec4(0.0, 0.0, 0.0, 1.0);
    float t = float(iters) / 256.0;
    return vec4(t, t, sqrt(t), 1.0);
}

vec4 iterToColor2(int iters) {
    if (iters == 256) return vec4(0.0, 0.0, 0.0, 1.0);
    float t = float(iters) / 256.0;
    return vec4(0.6*t, 4 * (t - 1) * -t, sqrt(t), 1.0);
}

void main() {
    vec2 complexNumber = fragCoordToComplex(fragCoord);

    // use 4 points to prevent aliasing
    vec2 c1 = complexNumber + 0.25 * u_zoom * vec2(1 / u_resolution.x, 1/ u_resolution.y);
    vec2 c2 = complexNumber - 0.25 * u_zoom * vec2(1 / u_resolution.x, 1/ u_resolution.y);
    vec2 c3 = complexNumber + 0.25 * u_zoom * vec2(1 / u_resolution.x, -1/ u_resolution.y);
    vec2 c4 = complexNumber - 0.25 * u_zoom * vec2(1 / u_resolution.x, -1/ u_resolution.y);

    int iters1 = mandelbrotIterations(c1);
    int iters2 = mandelbrotIterations(c2);
    int iters3 = mandelbrotIterations(c3);
    int iters4 = mandelbrotIterations(c4);

    // average the colors
    vec4 color = 0.25 * (iterToColor2(iters1) + iterToColor2(iters2) + iterToColor2(iters3) + iterToColor2(iters4));
    FragColor = color;
}