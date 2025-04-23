#include <iostream>
#include <string>
#include <vector>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>

class PortScanner {
public:
    std::vector<int> scan(const std::string& host, int start_port, int end_port) {
        std::vector<int> open_ports;
        int sock;
        struct sockaddr_in server;

        // Resolve hostname to IP
        struct hostent* he = gethostbyname(host.c_str());
        if (!he) {
            std::cerr << "Failed to resolve host: " << host << "\n";
            return open_ports;
        }
        std::string ip = inet_ntoa(*(struct in_addr*)he->h_addr);

        for (int port = start_port; port <= end_port; ++port) {
            sock = socket(AF_INET, SOCK_STREAM, 0);
            if (sock < 0) continue;

            server.sin_addr.s_addr = inet_addr(ip.c_str());
            server.sin_family = AF_INET;
            server.sin_port = htons(port);

            // Set timeout for connect
            struct timeval timeout;
            timeout.tv_sec = 1;
            timeout.tv_usec = 0;
            setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &timeout, sizeof(timeout));

            if (connect(sock, (struct sockaddr*)&server, sizeof(server)) == 0) {
                open_ports.push_back(port);
            }
            close(sock);
        }
        return open_ports;
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

    for (int port : open_ports) {
        std::cout << "Port " << port << " is open\n";
    }
    return 0;
}
