# CMAKE generated file: DO NOT EDIT!
# Generated by "Unix Makefiles" Generator, CMake Version 3.31

# Delete rule output on recipe failure.
.DELETE_ON_ERROR:

#=============================================================================
# Special targets provided by cmake.

# Disable implicit rules so canonical targets will work.
.SUFFIXES:

# Disable VCS-based implicit rules.
% : %,v

# Disable VCS-based implicit rules.
% : RCS/%

# Disable VCS-based implicit rules.
% : RCS/%,v

# Disable VCS-based implicit rules.
% : SCCS/s.%

# Disable VCS-based implicit rules.
% : s.%

.SUFFIXES: .hpux_make_needs_suffix_list

# Command-line flag to silence nested $(MAKE).
$(VERBOSE)MAKESILENT = -s

#Suppress display of executed commands.
$(VERBOSE).SILENT:

# A target that is always out of date.
cmake_force:
.PHONY : cmake_force

#=============================================================================
# Set environment variables for the build.

# The shell in which to execute make rules.
SHELL = /bin/sh

# The CMake executable.
CMAKE_COMMAND = /usr/bin/cmake

# The command to remove a file.
RM = /usr/bin/cmake -E rm -f

# Escaping for special characters.
EQUALS = =

# The top-level source directory on which CMake was run.
CMAKE_SOURCE_DIR = /home/tr47/Port-scanner/c++_scanner

# The top-level build directory on which CMake was run.
CMAKE_BINARY_DIR = /home/tr47/Port-scanner/c++_scanner/build

# Include any dependencies generated for this target.
include CMakeFiles/scanner.dir/depend.make
# Include any dependencies generated by the compiler for this target.
include CMakeFiles/scanner.dir/compiler_depend.make

# Include the progress variables for this target.
include CMakeFiles/scanner.dir/progress.make

# Include the compile flags for this target's objects.
include CMakeFiles/scanner.dir/flags.make

CMakeFiles/scanner.dir/codegen:
.PHONY : CMakeFiles/scanner.dir/codegen

CMakeFiles/scanner.dir/src/scanner.cpp.o: CMakeFiles/scanner.dir/flags.make
CMakeFiles/scanner.dir/src/scanner.cpp.o: /home/tr47/Port-scanner/c++_scanner/src/scanner.cpp
CMakeFiles/scanner.dir/src/scanner.cpp.o: CMakeFiles/scanner.dir/compiler_depend.ts
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --progress-dir=/home/tr47/Port-scanner/c++_scanner/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_1) "Building CXX object CMakeFiles/scanner.dir/src/scanner.cpp.o"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -MD -MT CMakeFiles/scanner.dir/src/scanner.cpp.o -MF CMakeFiles/scanner.dir/src/scanner.cpp.o.d -o CMakeFiles/scanner.dir/src/scanner.cpp.o -c /home/tr47/Port-scanner/c++_scanner/src/scanner.cpp

CMakeFiles/scanner.dir/src/scanner.cpp.i: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Preprocessing CXX source to CMakeFiles/scanner.dir/src/scanner.cpp.i"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -E /home/tr47/Port-scanner/c++_scanner/src/scanner.cpp > CMakeFiles/scanner.dir/src/scanner.cpp.i

CMakeFiles/scanner.dir/src/scanner.cpp.s: cmake_force
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green "Compiling CXX source to assembly CMakeFiles/scanner.dir/src/scanner.cpp.s"
	/usr/bin/c++ $(CXX_DEFINES) $(CXX_INCLUDES) $(CXX_FLAGS) -S /home/tr47/Port-scanner/c++_scanner/src/scanner.cpp -o CMakeFiles/scanner.dir/src/scanner.cpp.s

# Object files for target scanner
scanner_OBJECTS = \
"CMakeFiles/scanner.dir/src/scanner.cpp.o"

# External object files for target scanner
scanner_EXTERNAL_OBJECTS =

scanner: CMakeFiles/scanner.dir/src/scanner.cpp.o
scanner: CMakeFiles/scanner.dir/build.make
scanner: CMakeFiles/scanner.dir/compiler_depend.ts
scanner: CMakeFiles/scanner.dir/link.txt
	@$(CMAKE_COMMAND) -E cmake_echo_color "--switch=$(COLOR)" --green --bold --progress-dir=/home/tr47/Port-scanner/c++_scanner/build/CMakeFiles --progress-num=$(CMAKE_PROGRESS_2) "Linking CXX executable scanner"
	$(CMAKE_COMMAND) -E cmake_link_script CMakeFiles/scanner.dir/link.txt --verbose=$(VERBOSE)

# Rule to build all files generated by this target.
CMakeFiles/scanner.dir/build: scanner
.PHONY : CMakeFiles/scanner.dir/build

CMakeFiles/scanner.dir/clean:
	$(CMAKE_COMMAND) -P CMakeFiles/scanner.dir/cmake_clean.cmake
.PHONY : CMakeFiles/scanner.dir/clean

CMakeFiles/scanner.dir/depend:
	cd /home/tr47/Port-scanner/c++_scanner/build && $(CMAKE_COMMAND) -E cmake_depends "Unix Makefiles" /home/tr47/Port-scanner/c++_scanner /home/tr47/Port-scanner/c++_scanner /home/tr47/Port-scanner/c++_scanner/build /home/tr47/Port-scanner/c++_scanner/build /home/tr47/Port-scanner/c++_scanner/build/CMakeFiles/scanner.dir/DependInfo.cmake "--color=$(COLOR)"
.PHONY : CMakeFiles/scanner.dir/depend

