# Intro
This is a simple project to render the [Mandelbrot Set](https://en.wikipedia.org/wiki/Mandelbrot_set) using the GPU.
TLDR: The Mandelbrot set is the set of complex numbers c for which the function f(z) = z^2 + c does not diverge when iterated from z = 0.
Coloring is done using the number of iterations it takes for the function to 'diverge'.

![images/image_for_readme.png](images/image_for_readme.png)

# Dependencies
- OpenGL
- GLEW
- GLFW

Under Fedora, you can install the dependencies using the following command:
```bash
sudo dnf install mesa-libGL-devel glfw-devel glew-devel
```

# How to run
1. Clone the repository
2. install the dependencies
3. Run the following commands:
```bash
mkdir cmake-build-debug
cd cmake-build-debug
cmake ..
make
./mandelbrot
```

# Limitations
- This program reaches numerical limits when zooming in too far. This is due to the limited precision of numbers in computers.