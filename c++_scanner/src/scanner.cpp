#include <iostream>
#include <string>
#include <vector>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>
#include <fcntl.h>
#include <cstring>
#include <sys/time.h>

class PortScanner {
public:
    std::vector<int> scan(const std::string& host, int start_port, int end_port) {
        std::vector<int> open_ports;

        // Resolve hostname to IP
        struct hostent* he = gethostbyname(host.c_str());
        if (!he) {
            std::cerr << "❌ Failed to resolve host: " << host << "\n";
            return open_ports;
        }
        std::string ip = inet_ntoa(*(struct in_addr*)he->h_addr);
        std::cout << "🔍 Scanning host: " << host << " (" << ip << ")\n";

        for (int port = start_port; port <= end_port; ++port) {
            if (is_port_open(ip, port)) {
                open_ports.push_back(port);
                std::cout << "✅ Port " << port << " is open\n";
            } else {
                std::cerr << "⛔ Port " << port << " is closed or unreachable\n";
            }
        }

        return open_ports;
    }

private:
    bool is_port_open(const std::string& ip, int port) {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) return false;

        // Set non-blocking mode
        fcntl(sock, F_SETFL, O_NONBLOCK);

        sockaddr_in server{};
        server.sin_family = AF_INET;
        server.sin_port = htons(port);
        inet_pton(AF_INET, ip.c_str(), &server.sin_addr);

        connect(sock, (sockaddr*)&server, sizeof(server));

        fd_set fdset;
        FD_ZERO(&fdset);
        FD_SET(sock, &fdset);
        timeval tv = {1, 0}; // 1 second timeout

        bool is_open = false;
        if (select(sock + 1, nullptr, &fdset, nullptr, &tv) > 0) {
            int so_error;
            socklen_t len = sizeof(so_error);
            getsockopt(sock, SOL_SOCKET, SO_ERROR, &so_error, &len);
            is_open = (so_error == 0);
        }

        close(sock);
        return is_open;
    }
};

int main(int argc, char* argv[]) {
    if (argc != 4) {
        std::cerr << "Usage: " << argv[0] << " <host> <start_port> <end_port>\n";
        return 1;
    }

    std::string host = argv[1];
    int start_port = std::stoi(argv[2]);
    int end_port = std::stoi(argv[3]);

    PortScanner scanner;
    auto open_ports = scanner.scan(host, start_port, end_port);

    std::cout << "\n📋 Summary:\n";
    if (open_ports.empty()) {
        std::cout << "No open ports found in range " << start_port << "-" << end_port << ".\n";
    } else {
        for (int port : open_ports) {
            std::cout << "🟢 Port " << port << " is open\n";
        }
    }

    return 0;
}
