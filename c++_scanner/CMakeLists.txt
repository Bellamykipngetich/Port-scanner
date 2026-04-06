cmake_minimum_required(VERSION 3.10)
project(CyberScanner)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Threads REQUIRED)

add_executable(scanner src/scanner.cpp)
target_link_libraries(scanner Threads::Threads)
