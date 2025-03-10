#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <iostream>
#include <fstream>
#include <map>
#include <sstream>

GLuint LoadShader(const char *path, GLenum type) {
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open shader file " << path << std::endl;
        return 0;
    }

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string source = buffer.str();
    file.close();

    if (source.empty()) {
        std::cerr << "Error: Shader file " << path << " is empty!" << std::endl;
        return 0;
    }

    GLuint shader = glCreateShader(type);
    const char *src = source.c_str();
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);

    int success;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success) {
        char log[512];
        glGetShaderInfoLog(shader, 512, nullptr, log);
        std::cerr << "Shader Compilation Error (" << path << "): " << log << std::endl;
    }
    return shader;
}

// initial camera values
float center_x = -0.75f;
float center_y = 0.0f;
float zoom = 1.0f;

float julia_real = -0.8f;
float julia_imag = 0.156f;

std::map<int, bool> keysPressed = {};


void keyCallback(GLFWwindow *, const int key, int, const int action, int) {
    if (action == GLFW_PRESS) {
        keysPressed[key] = true;
    } else if (action == GLFW_RELEASE) {
        keysPressed[key] = false;
    }
}

void getInputs() {
    constexpr float moveSpeed = 0.035f;
    constexpr float zoomSpeed = 1.05f;
    constexpr float julia_speed = 0.0003f;
    if (keysPressed[GLFW_KEY_W]) {
        center_y += moveSpeed * zoom;
    }
    if (keysPressed[GLFW_KEY_S]) {
        center_y -= moveSpeed * zoom;
    }
    if (keysPressed[GLFW_KEY_A]) {
        center_x -= moveSpeed * zoom;
    }
    if (keysPressed[GLFW_KEY_D]) {
        center_x += moveSpeed * zoom;
    }
    if (keysPressed[GLFW_KEY_LEFT_SHIFT]) {
        zoom *= zoomSpeed;
    }
    if (keysPressed[GLFW_KEY_SPACE]) {
        zoom /= zoomSpeed;
    }
    if (keysPressed[GLFW_KEY_UP]) {
        julia_imag += julia_speed;
    }
    if (keysPressed[GLFW_KEY_DOWN]) {
        julia_imag -= julia_speed;
    }
    if (keysPressed[GLFW_KEY_LEFT]) {
        julia_real -= julia_speed;
    }
    if (keysPressed[GLFW_KEY_RIGHT]) {
        julia_real += julia_speed;
    }
}

int main() {
    if (!glfwInit()) return -1;
    const auto monitor = glfwGetPrimaryMonitor();
    const GLFWvidmode *mode = glfwGetVideoMode(monitor);
    GLFWwindow *window = glfwCreateWindow(mode->width, mode->height, "Mandelbrot", monitor, nullptr);
    glfwMakeContextCurrent(window);
    glfwSetKeyCallback(window, keyCallback);
    glewInit();

    constexpr float quadVertices[] = {
        -1.0f, -1.0f,
        1.0f, -1.0f,
        -1.0f, 1.0f,
        1.0f, 1.0f
    };

    GLuint VBO, VAO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), quadVertices, GL_STATIC_DRAW);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), static_cast<void *>(nullptr));
    glEnableVertexAttribArray(0);

    const GLuint vertShader = LoadShader("../shader.vert", GL_VERTEX_SHADER);
    const GLuint fragShader = LoadShader("../shader.frag", GL_FRAGMENT_SHADER);
    const GLuint shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vertShader);
    glAttachShader(shaderProgram, fragShader);
    glLinkProgram(shaderProgram);
    glUseProgram(shaderProgram);

    const GLint resLoc = glGetUniformLocation(shaderProgram, "u_resolution");
    const GLint centerLoc = glGetUniformLocation(shaderProgram, "u_center");
    const GLint zoomLoc = glGetUniformLocation(shaderProgram, "u_zoom");
    const GLint juliaLoc = glGetUniformLocation(shaderProgram, "u_julia");

    while (!glfwWindowShouldClose(window)) {
        glClear(GL_COLOR_BUFFER_BIT);

        int width, height;
        glfwGetFramebufferSize(window, &width, &height);
        glUniform2f(resLoc, static_cast<float>(width), static_cast<float>(height));
        glUniform2f(centerLoc, center_x, center_y);
        glUniform2f(juliaLoc, julia_real, julia_imag);
        glUniform1f(zoomLoc, zoom);

        getInputs();

        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteShader(vertShader);
    glDeleteShader(fragShader);
    glDeleteProgram(shaderProgram);
    glfwTerminate();
    return 0;
}
