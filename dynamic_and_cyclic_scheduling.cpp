#include <iostream>
#include <fstream>
#include <vector>
#include <thread>
#include <mutex>
#include <queue>
#include <complex>
#include <chrono>

struct Params {
    int width;
    int height;
    double centerX;
    double centerY;
    double zoom;
    int maxIterations;
    unsigned int numThreads;
    bool useDynamicScheduling;
};

int mandelbrot(const std::complex<double> c, const int maxIterations) {
    std::complex<double> z = 0;
    int iterations = 0;
    while (std::abs(z) <= 2.0 && iterations < maxIterations) {
        z = z * z + c;
        ++iterations;
    }
    return iterations;
}

class TaskQueue {
    std::queue<int> rows;
    std::mutex mtx;

public:
    explicit TaskQueue(const int height) {
        for (int i = 0; i < height; ++i)
            rows.push(i);
    }

    bool get_task(int &row) {
        std::lock_guard lock(mtx);
        if (rows.empty()) return false;
        row = rows.front();
        rows.pop();
        return true;
    }
};

// Worker that supports both dynamic and cyclic scheduling
void worker(const int thread_id,
            std::vector<std::vector<int> > &output,
            const Params &params,
            TaskQueue *tasks = nullptr) {
    if (params.useDynamicScheduling) {
        // Dynamic scheduling with TaskQueue
        int row;
        while (tasks->get_task(row)) {
            for (int x = 0; x < params.width; ++x) {
                const double fragX = 2.0 * x / (params.width - 1) - 1.0;
                const double fragY = 2.0 * row / (params.height - 1) - 1.0;

                const std::complex<double> c(
                    fragX * params.zoom + params.centerX,
                    fragY * params.zoom + params.centerY
                );

                const int iter = mandelbrot(c, params.maxIterations);
                output[row][x] = iter;
            }
        }
    } else {
        // Cyclic scheduling
        for (int row = thread_id; row < params.height; row += params.numThreads) {
            for (int x = 0; x < params.width; ++x) {
                const double fragX = 2.0 * x / (params.width - 1) - 1.0;
                const double fragY = 2.0 * row / (params.height - 1) - 1.0;

                const std::complex<double> c(
                    fragX * params.zoom + params.centerX,
                    fragY * params.zoom + params.centerY
                );

                const int iter = mandelbrot(c, params.maxIterations);
                output[row][x] = iter;
            }
        }
    }
}

void write_ppm(const std::vector<std::vector<int> > &image, const Params &params, const std::string &filename) {
    std::ofstream ofs(filename);
    ofs << "P3\n" << params.width << " " << params.height << "\n255\n";
    for (int y = 0; y < params.height; ++y) {
        for (int x = 0; x < params.width; ++x) {
            const int iter = image[y][x];
            const int color = static_cast<int>(255.0 * iter / params.maxIterations);
            ofs << color << " " << color << " " << color << " ";
        }
        ofs << "\n";
    }
}

double run_and_time(const Params &params) {
    std::vector output(params.height, std::vector(params.width, 0));
    TaskQueue *tasks = nullptr;

    if (params.useDynamicScheduling) {
        tasks = new TaskQueue(params.height);
    }

    const auto start_time = std::chrono::steady_clock::now();

    std::vector<std::thread> threads;
    for (unsigned int i = 0; i < params.numThreads; ++i) {
        if (params.useDynamicScheduling)
            threads.emplace_back(worker, i, std::ref(output), std::ref(params), tasks);
        else
            threads.emplace_back(worker, i, std::ref(output), std::ref(params), nullptr);
    }
    for (auto &t: threads) {
        t.join();
    }

    const auto end_time = std::chrono::steady_clock::now();
    if (tasks) delete tasks;

    const std::chrono::duration<double> elapsed_seconds = end_time - start_time;

    // Optionally save an image for last run or certain cases:
    // write_ppm(output, params, "mandelbrot.ppm");

    return elapsed_seconds.count();
}

int main() {
    constexpr double centerX = -0.75;
    constexpr double centerY = 0.0;
    constexpr double zoom = 1.5;

    const std::vector widths = {400, 800, 2880};
    const std::vector heights = {400, 800, 1920};
    const std::vector maxIters = {500, 1000, 2000};
    const std::vector<unsigned int> thread_counts = {1, 2, 4, 8, 16, 18, 24, 32};
    const std::vector scheduling_modes = {true, false}; // true = dynamic, false = cyclic

    std::cout << "Running parameter sweep for Mandelbrot...\n";

    for (const bool useDynamic: scheduling_modes) {
        std::cout << "Scheduling mode: " << (useDynamic ? "Dynamic" : "Cyclic") << "\n";
        std::cout << "Threads,Resolution,Max Iterations,Time (s)" << std::endl;
        for (const auto &numThreads: thread_counts) {
            for (size_t i = 0; i < widths.size(); ++i) {
                for (const auto &maxIter: maxIters) {
                    Params params{};
                    params.width = widths[i];
                    params.height = heights[i];
                    params.centerX = centerX;
                    params.centerY = centerY;
                    params.zoom = zoom;
                    params.maxIterations = maxIter;
                    params.numThreads = numThreads;
                    params.useDynamicScheduling = useDynamic;;

                    const double elapsed = run_and_time(params);

                    std::cout << numThreads << "," << params.width << "x" << params.height << "," << maxIter << "," << elapsed << std::endl;
                }
            }
        }
    }



    return 0;
}
