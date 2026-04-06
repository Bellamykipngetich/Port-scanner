#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>
#include <fcntl.h>
#include <cstring>
#include <sys/time.h>
#include <thread>
#include <mutex>
#include <atomic>
#include <chrono>
#include <sstream>
#include <algorithm>

static const std::map<int, std::string> KNOWN_SERVICES = {
    {20, "FTP-DATA"}, {21, "FTP"}, {22, "SSH"}, {23, "TELNET"},
    {25, "SMTP"}, {53, "DNS"}, {67, "DHCP"}, {68, "DHCP"},
    {69, "TFTP"}, {80, "HTTP"}, {110, "POP3"}, {119, "NNTP"},
    {123, "NTP"}, {135, "MSRPC"}, {137, "NETBIOS-NS"}, {138, "NETBIOS-DGM"},
    {139, "NETBIOS-SSN"}, {143, "IMAP"}, {161, "SNMP"}, {162, "SNMP-TRAP"},
    {179, "BGP"}, {389, "LDAP"}, {443, "HTTPS"}, {445, "SMB"},
    {465, "SMTPS"}, {514, "SYSLOG"}, {515, "LPD"}, {587, "SMTP-SUB"},
    {636, "LDAPS"}, {993, "IMAPS"}, {995, "POP3S"}, {1080, "SOCKS"},
    {1433, "MSSQL"}, {1434, "MSSQL-M"}, {1521, "ORACLE"}, {1723, "PPTP"},
    {2049, "NFS"}, {2082, "CPANEL"}, {2083, "CPANEL-SSL"}, {2181, "ZOOKEEPER"},
    {3306, "MYSQL"}, {3389, "RDP"}, {3690, "SVN"}, {4443, "HTTPS-ALT"},
    {5432, "POSTGRESQL"}, {5672, "AMQP"}, {5900, "VNC"}, {5984, "COUCHDB"},
    {6379, "REDIS"}, {6443, "K8S-API"}, {8080, "HTTP-PROXY"}, {8443, "HTTPS-ALT"},
    {8888, "HTTP-ALT"}, {9090, "PROMETHEUS"}, {9200, "ELASTICSEARCH"},
    {9418, "GIT"}, {11211, "MEMCACHED"}, {27017, "MONGODB"}, {27018, "MONGODB"},
    {50000, "SAP"}, {50070, "HADOOP"}
};

struct PortResult {
    int port;
    bool open;
    std::string service;
    std::string banner;
    double latency_ms;
};

class PortScanner {
public:
    PortScanner(int timeout_ms = 1500, int max_threads = 100)
        : timeout_ms_(timeout_ms), max_threads_(max_threads) {}

    std::vector<PortResult> scan(const std::string& host, int start_port, int end_port) {
        struct hostent* he = gethostbyname(host.c_str());
        if (!he) {
            std::cerr << "ERROR: Failed to resolve host: " << host << std::endl;
            return {};
        }
        resolved_ip_ = inet_ntoa(*(struct in_addr*)he->h_addr);

        std::vector<PortResult> results;
        std::mutex results_mutex;
        std::atomic<int> scanned_count(0);
        int total_ports = end_port - start_port + 1;

        int thread_count = std::min(max_threads_, total_ports);
        std::vector<std::thread> threads;

        auto worker = [&](int thread_id) {
            for (int port = start_port + thread_id; port <= end_port; port += thread_count) {
                auto start = std::chrono::high_resolution_clock::now();
                bool open = is_port_open(resolved_ip_, port);
                auto end = std::chrono::high_resolution_clock::now();
                double latency = std::chrono::duration<double, std::milli>(end - start).count();

                if (open) {
                    PortResult pr;
                    pr.port = port;
                    pr.open = true;
                    pr.latency_ms = latency;

                    auto it = KNOWN_SERVICES.find(port);
                    pr.service = (it != KNOWN_SERVICES.end()) ? it->second : "UNKNOWN";

                    pr.banner = grab_banner(resolved_ip_, port);

                    std::lock_guard<std::mutex> lock(results_mutex);
                    results.push_back(pr);
                }
                scanned_count++;
            }
        };

        for (int i = 0; i < thread_count; i++) {
            threads.emplace_back(worker, i);
        }

        for (auto& t : threads) {
            t.join();
        }

        std::sort(results.begin(), results.end(),
            [](const PortResult& a, const PortResult& b) { return a.port < b.port; });

        return results;
    }

    const std::string& get_resolved_ip() const { return resolved_ip_; }

private:
    int timeout_ms_;
    int max_threads_;
    std::string resolved_ip_;

    bool is_port_open(const std::string& ip, int port) {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) return false;

        fcntl(sock, F_SETFL, O_NONBLOCK);

        sockaddr_in server{};
        server.sin_family = AF_INET;
        server.sin_port = htons(port);
        inet_pton(AF_INET, ip.c_str(), &server.sin_addr);

        connect(sock, (sockaddr*)&server, sizeof(server));

        fd_set fdset;
        FD_ZERO(&fdset);
        FD_SET(sock, &fdset);
        timeval tv;
        tv.tv_sec = timeout_ms_ / 1000;
        tv.tv_usec = (timeout_ms_ % 1000) * 1000;

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

    std::string grab_banner(const std::string& ip, int port) {
        int sock = socket(AF_INET, SOCK_STREAM, 0);
        if (sock < 0) return "";

        sockaddr_in server{};
        server.sin_family = AF_INET;
        server.sin_port = htons(port);
        inet_pton(AF_INET, ip.c_str(), &server.sin_addr);

        timeval tv;
        tv.tv_sec = 2;
        tv.tv_usec = 0;
        setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
        setsockopt(sock, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));

        if (connect(sock, (sockaddr*)&server, sizeof(server)) < 0) {
            close(sock);
            return "";
        }

        char buffer[256] = {0};
        ssize_t bytes = recv(sock, buffer, sizeof(buffer) - 1, 0);
        close(sock);

        if (bytes <= 0) return "";

        std::string banner(buffer, bytes);
        // Sanitize: remove control chars except space
        std::string clean;
        for (char c : banner) {
            if (c >= 32 && c < 127) clean += c;
            else if (c == '\n' || c == '\r') clean += ' ';
        }
        // Trim
        while (!clean.empty() && clean.back() == ' ') clean.pop_back();
        return clean.substr(0, 128);
    }
};

static std::string escape_json(const std::string& s) {
    std::string out;
    for (char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:   out += c;
        }
    }
    return out;
}

int main(int argc, char* argv[]) {
    if (argc < 4 || argc > 5) {
        std::cerr << "Usage: " << argv[0] << " <host> <start_port> <end_port> [timeout_ms]" << std::endl;
        return 1;
    }

    std::string host = argv[1];
    int start_port, end_port;
    int timeout_ms = 1500;

    try {
        start_port = std::stoi(argv[2]);
        end_port = std::stoi(argv[3]);
        if (argc == 5) timeout_ms = std::stoi(argv[4]);
    } catch (...) {
        std::cerr << "ERROR: Invalid port numbers" << std::endl;
        return 1;
    }

    if (start_port < 1 || end_port > 65535 || start_port > end_port) {
        std::cerr << "ERROR: Invalid port range" << std::endl;
        return 1;
    }

    auto scan_start = std::chrono::high_resolution_clock::now();

    PortScanner scanner(timeout_ms);
    auto results = scanner.scan(host, start_port, end_port);

    auto scan_end = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(scan_end - scan_start).count();

    // Output JSON
    std::cout << "{" << std::endl;
    std::cout << "  \"host\": \"" << escape_json(host) << "\"," << std::endl;
    std::cout << "  \"ip\": \"" << escape_json(scanner.get_resolved_ip()) << "\"," << std::endl;
    std::cout << "  \"startPort\": " << start_port << "," << std::endl;
    std::cout << "  \"endPort\": " << end_port << "," << std::endl;
    std::cout << "  \"totalScanned\": " << (end_port - start_port + 1) << "," << std::endl;
    std::cout << "  \"scanDurationMs\": " << (int)duration_ms << "," << std::endl;
    std::cout << "  \"openPorts\": [" << std::endl;

    for (size_t i = 0; i < results.size(); i++) {
        const auto& r = results[i];
        std::cout << "    {\"port\": " << r.port
                  << ", \"service\": \"" << escape_json(r.service) << "\""
                  << ", \"banner\": \"" << escape_json(r.banner) << "\""
                  << ", \"latencyMs\": " << (int)r.latency_ms
                  << "}";
        if (i < results.size() - 1) std::cout << ",";
        std::cout << std::endl;
    }

    std::cout << "  ]" << std::endl;
    std::cout << "}" << std::endl;

    return 0;
}
