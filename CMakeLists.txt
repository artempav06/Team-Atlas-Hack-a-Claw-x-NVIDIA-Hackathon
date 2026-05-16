cmake_minimum_required(VERSION 3.16)

project(AtlasCampusAgent LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(atlas_backend
    backend/main.cpp
)

if (WIN32)
    target_link_libraries(atlas_backend PRIVATE ws2_32)
endif()
