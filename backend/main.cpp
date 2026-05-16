#include <algorithm>
#include <chrono>
#include <cctype>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <winsock2.h>
#include <ws2tcpip.h>
using socket_t = SOCKET;
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
using socket_t = int;
#endif

namespace fs = std::filesystem;

struct HttpRequest {
    std::string method;
    std::string path;
    std::map<std::string, std::string> headers;
    std::string body;
};

struct Profile {
    std::string major;
    std::string year;
    std::string goals;
    std::string interests;
    std::string availability;
    std::string feedback;
};

struct Event {
    std::string title;
    std::string date;
    std::string time;
    std::string location;
    std::string source;
    std::string tags;
    std::string description;
    double confidence;
};

struct PlanItem {
    Event event;
    int score;
    std::string reason;
};

static fs::path g_root;

std::string nowStamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    std::tm tm{};
#ifdef _WIN32
    localtime_s(&tm, &time);
#else
    localtime_r(&time, &tm);
#endif
    std::ostringstream out;
    out << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
    return out.str();
}

std::string lower(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return value;
}

std::string readTextFile(const fs::path& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) {
        return "";
    }
    std::ostringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

void writeTextFile(const fs::path& path, const std::string& content) {
    fs::create_directories(path.parent_path());
    std::ofstream file(path, std::ios::binary | std::ios::trunc);
    file << content;
}

std::string jsonEscape(const std::string& input) {
    std::ostringstream out;
    for (char c : input) {
        switch (c) {
            case '\\': out << "\\\\"; break;
            case '"': out << "\\\""; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    out << "\\u00";
                    const char* hex = "0123456789abcdef";
                    out << hex[(c >> 4) & 0xF] << hex[c & 0xF];
                } else {
                    out << c;
                }
        }
    }
    return out.str();
}

std::string jsonString(const std::string& value) {
    return "\"" + jsonEscape(value) + "\"";
}

std::string unescapeJsonString(const std::string& input) {
    std::string out;
    for (size_t i = 0; i < input.size(); ++i) {
        if (input[i] != '\\' || i + 1 >= input.size()) {
            out.push_back(input[i]);
            continue;
        }
        char next = input[++i];
        switch (next) {
            case 'n': out.push_back('\n'); break;
            case 'r': out.push_back('\r'); break;
            case 't': out.push_back('\t'); break;
            case '"': out.push_back('"'); break;
            case '\\': out.push_back('\\'); break;
            default: out.push_back(next); break;
        }
    }
    return out;
}

std::string extractJsonString(const std::string& body, const std::string& key) {
    std::string needle = "\"" + key + "\"";
    size_t keyPos = body.find(needle);
    if (keyPos == std::string::npos) {
        return "";
    }
    size_t colon = body.find(':', keyPos + needle.size());
    if (colon == std::string::npos) {
        return "";
    }
    size_t pos = colon + 1;
    while (pos < body.size() && std::isspace(static_cast<unsigned char>(body[pos]))) {
        ++pos;
    }
    if (pos >= body.size() || body[pos] != '"') {
        return "";
    }
    ++pos;
    std::string raw;
    bool escaped = false;
    for (; pos < body.size(); ++pos) {
        char c = body[pos];
        if (escaped) {
            raw.push_back('\\');
            raw.push_back(c);
            escaped = false;
            continue;
        }
        if (c == '\\') {
            escaped = true;
            continue;
        }
        if (c == '"') {
            break;
        }
        raw.push_back(c);
    }
    return unescapeJsonString(raw);
}

fs::path findProjectRoot() {
    fs::path current = fs::current_path();
    for (int i = 0; i < 8; ++i) {
        if (fs::exists(current / "UI" / "index.html") ||
            fs::exists(current / "frontend" / "index.html")) {
            return current;
        }
        if (!current.has_parent_path()) {
            break;
        }
        current = current.parent_path();
    }
    return fs::current_path();
}

fs::path staticRoot() {
    if (fs::exists(g_root / "UI" / "index.html")) {
        return g_root / "UI";
    }
    return g_root / "frontend";
}

fs::path longTermPath() {
    return g_root / "memory" / "long_term.md";
}

fs::path shortTermPath() {
    return g_root / "memory" / "short_term.md";
}

void ensureMemoryFiles() {
    if (!fs::exists(longTermPath())) {
        writeTextFile(longTermPath(),
            "# Atlas Long-Term Memory\n\n"
            "Stable facts, preferences, and feedback for the Student Planner agent.\n\n"
            "<!-- ATLAS_PROFILE_START -->\n"
            "Major:\n"
            "Year:\n"
            "Goals:\n"
            "Interests:\n"
            "Availability:\n"
            "Event Feedback:\n"
            "<!-- ATLAS_PROFILE_END -->\n");
    }
    if (!fs::exists(shortTermPath())) {
        writeTextFile(shortTermPath(),
            "# Atlas Short-Term Memory\n\n"
            "Ephemeral context for the current Campus Scout and Student Planner run.\n\n"
            "<!-- ATLAS_SESSION_START -->\n"
            "No agent run yet.\n"
            "<!-- ATLAS_SESSION_END -->\n");
    }
}

std::string lineValue(const std::string& block, const std::string& label) {
    size_t pos = block.find(label);
    if (pos == std::string::npos) {
        return "";
    }
    pos += label.size();
    size_t end = block.find('\n', pos);
    std::string value = block.substr(pos, end == std::string::npos ? std::string::npos : end - pos);
    while (!value.empty() && std::isspace(static_cast<unsigned char>(value.front()))) {
        value.erase(value.begin());
    }
    while (!value.empty() && std::isspace(static_cast<unsigned char>(value.back()))) {
        value.pop_back();
    }
    return value;
}

std::string profileBlockFrom(const std::string& doc) {
    const std::string start = "<!-- ATLAS_PROFILE_START -->";
    const std::string end = "<!-- ATLAS_PROFILE_END -->";
    size_t startPos = doc.find(start);
    size_t endPos = doc.find(end);
    if (startPos == std::string::npos || endPos == std::string::npos || endPos < startPos) {
        return "";
    }
    return doc.substr(startPos + start.size(), endPos - (startPos + start.size()));
}

Profile loadProfile() {
    std::string doc = readTextFile(longTermPath());
    std::string block = profileBlockFrom(doc);
    return {
        lineValue(block, "Major:"),
        lineValue(block, "Year:"),
        lineValue(block, "Goals:"),
        lineValue(block, "Interests:"),
        lineValue(block, "Availability:"),
        lineValue(block, "Event Feedback:")
    };
}

void saveProfile(const Profile& profile) {
    std::string doc = readTextFile(longTermPath());
    const std::string start = "<!-- ATLAS_PROFILE_START -->";
    const std::string end = "<!-- ATLAS_PROFILE_END -->";
    std::ostringstream block;
    block << start << "\n"
          << "Major: " << profile.major << "\n"
          << "Year: " << profile.year << "\n"
          << "Goals: " << profile.goals << "\n"
          << "Interests: " << profile.interests << "\n"
          << "Availability: " << profile.availability << "\n"
          << "Event Feedback: " << profile.feedback << "\n"
          << end;

    size_t startPos = doc.find(start);
    size_t endPos = doc.find(end);
    if (startPos == std::string::npos || endPos == std::string::npos || endPos < startPos) {
        doc += "\n\n" + block.str() + "\n";
    } else {
        doc.replace(startPos, endPos + end.size() - startPos, block.str());
    }
    writeTextFile(longTermPath(), doc);
}

void writeShortTermSession(const std::string& content) {
    std::string doc = readTextFile(shortTermPath());
    const std::string start = "<!-- ATLAS_SESSION_START -->";
    const std::string end = "<!-- ATLAS_SESSION_END -->";
    std::string block = start + "\n" + content + "\n" + end;
    size_t startPos = doc.find(start);
    size_t endPos = doc.find(end);
    if (startPos == std::string::npos || endPos == std::string::npos || endPos < startPos) {
        doc += "\n\n" + block + "\n";
    } else {
        doc.replace(startPos, endPos + end.size() - startPos, block);
    }
    writeTextFile(shortTermPath(), doc);
}

std::vector<Event> demoEvents() {
    return {
        {
            "Hack-a-Claw kickoff and team formation",
            "2026-05-15",
            "6:00 PM - 7:00 PM",
            "Kresge Academic Building",
            "Hackathon brief",
            "AI, hackathon, networking, NVIDIA",
            "Opening block for builders using OpenClaw, Nemotron, and campus compute resources.",
            0.96
        },
        {
            "Student startup competition and job fair",
            "2026-05-16",
            "12:00 PM - 3:00 PM",
            "Baskin Engineering courtyard",
            "Demo campus calendar",
            "career, startups, internships, networking",
            "Career-focused campus event for students looking for internships, founders, and portfolio feedback.",
            0.89
        },
        {
            "AI systems research mixer",
            "2026-05-16",
            "2:00 PM - 4:00 PM",
            "Engineering 2",
            "Demo department page",
            "AI, research, computer engineering, robotics",
            "Faculty and student mixer for AI systems, robotics, and applied machine learning projects.",
            0.91
        },
        {
            "Low-key board games and dinner",
            "2026-05-16",
            "7:00 PM - 9:00 PM",
            "College Nine lounge",
            "Demo student bulletin",
            "social, food, wellness, community",
            "Relaxed evening event for meeting people after a long build block.",
            0.82
        }
    };
}

std::string eventsJson(const std::vector<Event>& events) {
    std::ostringstream out;
    out << "[";
    for (size_t i = 0; i < events.size(); ++i) {
        const auto& e = events[i];
        if (i > 0) {
            out << ",";
        }
        out << "{"
            << "\"title\":" << jsonString(e.title) << ","
            << "\"date\":" << jsonString(e.date) << ","
            << "\"time\":" << jsonString(e.time) << ","
            << "\"location\":" << jsonString(e.location) << ","
            << "\"source\":" << jsonString(e.source) << ","
            << "\"tags\":" << jsonString(e.tags) << ","
            << "\"description\":" << jsonString(e.description) << ","
            << "\"confidence\":" << e.confidence
            << "}";
    }
    out << "]";
    return out.str();
}

int scoreEvent(const Event& event, const Profile& profile) {
    std::string haystack = lower(event.title + " " + event.tags + " " + event.description);
    std::string profileText = lower(profile.major + " " + profile.goals + " " + profile.interests);
    int score = 45;

    std::vector<std::string> signals = {
        "ai", "robotics", "hackathon", "career", "startup", "internship",
        "research", "networking", "social", "food", "wellness"
    };
    for (const auto& signal : signals) {
        if (haystack.find(signal) != std::string::npos &&
            profileText.find(signal) != std::string::npos) {
            score += 12;
        }
    }
    if (!profile.major.empty() && haystack.find(lower(profile.major)) != std::string::npos) {
        score += 18;
    }
    if (lower(profile.availability).find("weekend") != std::string::npos &&
        event.date == "2026-05-16") {
        score += 10;
    }
    if (lower(profile.feedback).find("skip " + lower(event.title)) != std::string::npos) {
        score -= 35;
    }
    return std::max(0, std::min(100, score));
}

std::string reasonFor(const Event& event, const Profile& profile) {
    std::string tags = lower(event.tags);
    std::string profileText = lower(profile.goals + " " + profile.interests + " " + profile.major);
    if (tags.find("career") != std::string::npos || tags.find("internship") != std::string::npos) {
        return "Strong fit for career, internship, and networking goals.";
    }
    if (tags.find("ai") != std::string::npos || tags.find("research") != std::string::npos) {
        return "Matches technical interests and gives the planner a high-value academic anchor.";
    }
    if (tags.find("social") != std::string::npos && profileText.find("social") != std::string::npos) {
        return "Adds a lower-pressure social block after heavier work sessions.";
    }
    return "Useful campus opportunity with clean source metadata and a schedule slot the planner can reason over.";
}

std::vector<PlanItem> makePlan(const Profile& profile) {
    std::vector<PlanItem> plan;
    for (const auto& event : demoEvents()) {
        plan.push_back({event, scoreEvent(event, profile), reasonFor(event, profile)});
    }
    std::sort(plan.begin(), plan.end(), [](const PlanItem& a, const PlanItem& b) {
        return a.score > b.score;
    });
    if (plan.size() > 3) {
        plan.resize(3);
    }
    return plan;
}

std::string planJson(const std::vector<PlanItem>& plan) {
    std::ostringstream out;
    out << "[";
    for (size_t i = 0; i < plan.size(); ++i) {
        if (i > 0) {
            out << ",";
        }
        out << "{"
            << "\"title\":" << jsonString(plan[i].event.title) << ","
            << "\"date\":" << jsonString(plan[i].event.date) << ","
            << "\"time\":" << jsonString(plan[i].event.time) << ","
            << "\"location\":" << jsonString(plan[i].event.location) << ","
            << "\"score\":" << plan[i].score << ","
            << "\"reason\":" << jsonString(plan[i].reason)
            << "}";
    }
    out << "]";
    return out.str();
}

std::string profileJson(const Profile& profile) {
    return "{"
        "\"major\":" + jsonString(profile.major) + ","
        "\"year\":" + jsonString(profile.year) + ","
        "\"goals\":" + jsonString(profile.goals) + ","
        "\"interests\":" + jsonString(profile.interests) + ","
        "\"availability\":" + jsonString(profile.availability) + ","
        "\"feedback\":" + jsonString(profile.feedback) +
    "}";
}

std::string contentTypeFor(const std::string& path) {
    if (path.size() >= 5 && path.substr(path.size() - 5) == ".html") return "text/html; charset=utf-8";
    if (path.size() >= 4 && path.substr(path.size() - 4) == ".css") return "text/css; charset=utf-8";
    if (path.size() >= 3 && path.substr(path.size() - 3) == ".js") return "application/javascript; charset=utf-8";
    return "text/plain; charset=utf-8";
}

std::string headerValue(const std::map<std::string, std::string>& headers, const std::string& key) {
    auto it = headers.find(lower(key));
    return it == headers.end() ? "" : it->second;
}

HttpRequest parseRequest(const std::string& raw) {
    HttpRequest request;
    size_t headerEnd = raw.find("\r\n\r\n");
    std::string head = raw.substr(0, headerEnd);
    request.body = headerEnd == std::string::npos ? "" : raw.substr(headerEnd + 4);

    std::istringstream stream(head);
    stream >> request.method >> request.path;
    size_t query = request.path.find('?');
    if (query != std::string::npos) {
        request.path = request.path.substr(0, query);
    }

    std::string line;
    std::getline(stream, line);
    while (std::getline(stream, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }
        size_t colon = line.find(':');
        if (colon == std::string::npos) {
            continue;
        }
        std::string key = lower(line.substr(0, colon));
        std::string value = line.substr(colon + 1);
        while (!value.empty() && std::isspace(static_cast<unsigned char>(value.front()))) {
            value.erase(value.begin());
        }
        request.headers[key] = value;
    }
    return request;
}

std::string readHttpMessage(socket_t client) {
    std::string data;
    char buffer[4096];
    while (true) {
#ifdef _WIN32
        int received = recv(client, buffer, sizeof(buffer), 0);
#else
        ssize_t received = recv(client, buffer, sizeof(buffer), 0);
#endif
        if (received <= 0) {
            break;
        }
        data.append(buffer, buffer + received);
        size_t headerEnd = data.find("\r\n\r\n");
        if (headerEnd == std::string::npos) {
            continue;
        }
        HttpRequest partial = parseRequest(data);
        std::string lengthText = headerValue(partial.headers, "Content-Length");
        size_t contentLength = lengthText.empty() ? 0 : static_cast<size_t>(std::stoul(lengthText));
        if (data.size() >= headerEnd + 4 + contentLength) {
            break;
        }
    }
    return data;
}

void closeSocket(socket_t socketHandle) {
#ifdef _WIN32
    closesocket(socketHandle);
#else
    close(socketHandle);
#endif
}

void sendAll(socket_t client, const std::string& data) {
    size_t sent = 0;
    while (sent < data.size()) {
#ifdef _WIN32
        int result = send(client, data.data() + sent, static_cast<int>(data.size() - sent), 0);
#else
        ssize_t result = send(client, data.data() + sent, data.size() - sent, 0);
#endif
        if (result <= 0) {
            break;
        }
        sent += static_cast<size_t>(result);
    }
}

std::string response(int status, const std::string& label, const std::string& body, const std::string& contentType) {
    std::ostringstream out;
    out << "HTTP/1.1 " << status << " " << label << "\r\n"
        << "Content-Type: " << contentType << "\r\n"
        << "Content-Length: " << body.size() << "\r\n"
        << "Access-Control-Allow-Origin: *\r\n"
        << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
        << "Access-Control-Allow-Headers: Content-Type\r\n"
        << "Connection: close\r\n"
        << "\r\n"
        << body;
    return out.str();
}

std::string handleApi(const HttpRequest& request) {
    ensureMemoryFiles();

    if (request.method == "GET" && request.path == "/api/memory") {
        Profile profile = loadProfile();
        std::string body = "{"
            "\"profile\":" + profileJson(profile) + ","
            "\"longTerm\":" + jsonString(readTextFile(longTermPath())) + ","
            "\"shortTerm\":" + jsonString(readTextFile(shortTermPath())) +
        "}";
        return response(200, "OK", body, "application/json; charset=utf-8");
    }

    if (request.method == "GET" && request.path == "/api/events") {
        return response(200, "OK", "{\"ok\":true,\"events\":" + eventsJson(demoEvents()) + "}", "application/json; charset=utf-8");
    }

    if (request.method == "POST" && request.path == "/api/profile") {
        Profile profile = loadProfile();
        profile.major = extractJsonString(request.body, "major");
        profile.year = extractJsonString(request.body, "year");
        profile.goals = extractJsonString(request.body, "goals");
        profile.interests = extractJsonString(request.body, "interests");
        profile.availability = extractJsonString(request.body, "availability");
        saveProfile(profile);
        writeShortTermSession(
            "Updated student profile at " + nowStamp() + ".\n\n"
            "The next planner run should read long-term memory before scoring events.");
        return response(200, "OK", "{\"ok\":true,\"profile\":" + profileJson(profile) + "}", "application/json; charset=utf-8");
    }

    if (request.method == "POST" && request.path == "/api/scout/run") {
        auto events = demoEvents();
        std::ostringstream session;
        session << "Campus Scout run at " << nowStamp() << ".\n\n"
                << "Agent: Campus Scout\n\n"
                << "Actions:\n"
                << "- Loaded approved campus source set.\n"
                << "- Parsed " << events.size() << " demo seed events.\n"
                << "- Normalized event names, dates, locations, tags, and source labels.\n"
                << "- Scrubbed raw notes before handing data to Student Planner.\n\n"
                << "Clean Event Candidates:\n";
        for (const auto& event : events) {
            session << "- " << event.title << " | " << event.date << " | " << event.time
                    << " | " << event.location << " | tags: " << event.tags << "\n";
        }
        writeShortTermSession(session.str());
        std::string body = "{\"ok\":true,\"events\":" + eventsJson(events) + ",\"activity\":["
            "\"Loaded approved campus sources\","
            "\"Extracted demo events\","
            "\"Normalized clean event objects\","
            "\"Updated short-term memory\""
        "]}";
        return response(200, "OK", body, "application/json; charset=utf-8");
    }

    if (request.method == "POST" && request.path == "/api/planner/generate") {
        Profile profile = loadProfile();
        auto plan = makePlan(profile);
        std::ostringstream session;
        session << "Student Planner run at " << nowStamp() << ".\n\n"
                << "Agent: Student Planner\n\n"
                << "Inputs:\n"
                << "- Long-term profile memory\n"
                << "- Clean event candidates from Campus Scout\n\n"
                << "Recommended Plan:\n";
        for (const auto& item : plan) {
            session << "- " << item.event.date << " " << item.event.time << ": "
                    << item.event.title << " [" << item.score << "/100] - "
                    << item.reason << "\n";
        }
        writeShortTermSession(session.str());
        std::string body = "{\"ok\":true,\"plan\":" + planJson(plan) + ",\"activity\":["
            "\"Loaded long-term memory\","
            "\"Read clean event candidates\","
            "\"Scored events against profile\","
            "\"Wrote planner context to short-term memory\""
        "]}";
        return response(200, "OK", body, "application/json; charset=utf-8");
    }

    if (request.method == "POST" && request.path == "/api/feedback") {
        Profile profile = loadProfile();
        std::string action = extractJsonString(request.body, "action");
        std::string title = extractJsonString(request.body, "title");
        std::string note = extractJsonString(request.body, "note");
        std::string entry = action + " " + title;
        if (!note.empty()) {
            entry += " (" + note + ")";
        }
        if (!profile.feedback.empty()) {
            profile.feedback += " | ";
        }
        profile.feedback += entry;
        saveProfile(profile);
        writeShortTermSession(
            "Feedback captured at " + nowStamp() + ".\n\n"
            "Memory update:\n"
            "- " + entry + "\n\n"
            "The next planner run should use this long-term preference signal.");
        return response(200, "OK", "{\"ok\":true,\"profile\":" + profileJson(profile) + "}", "application/json; charset=utf-8");
    }

    if (request.method == "GET" && request.path == "/api/security") {
        std::string body =
            "{"
            "\"campusScoutAllowed\":[\"Read approved campus event sources\",\"Read demo event/email inputs\",\"Write short-term memory\"],"
            "\"campusScoutBlocked\":[\"Read arbitrary local files\",\"Access private messages\",\"Send emails or posts\",\"Browse unapproved domains\"],"
            "\"studentPlannerAllowed\":[\"Read long-term memory\",\"Read short-term clean event context\",\"Write planner recommendations\"],"
            "\"studentPlannerBlocked\":[\"Read raw inbox data\",\"Access Discord or Instagram directly\",\"Browse the web directly\"]"
            "}";
        return response(200, "OK", body, "application/json; charset=utf-8");
    }

    return response(404, "Not Found", "{\"error\":\"Unknown API route\"}", "application/json; charset=utf-8");
}

std::string handleStatic(const HttpRequest& request) {
    std::string path = request.path == "/" ? "/index.html" : request.path;
    if (path != "/index.html" && path != "/styles.css" && path != "/app.js") {
        return response(404, "Not Found", "Not found", "text/plain; charset=utf-8");
    }
    fs::path file = staticRoot() / path.substr(1);
    std::string body = readTextFile(file);
    if (body.empty() && !fs::exists(file)) {
        return response(404, "Not Found", "Not found", "text/plain; charset=utf-8");
    }
    return response(200, "OK", body, contentTypeFor(file.string()));
}

std::string handleRequest(const HttpRequest& request) {
    if (request.method == "OPTIONS") {
        return response(204, "No Content", "", "text/plain; charset=utf-8");
    }
    if (request.path.rfind("/api/", 0) == 0) {
        return handleApi(request);
    }
    return handleStatic(request);
}

bool initNetwork() {
#ifdef _WIN32
    WSADATA wsaData;
    return WSAStartup(MAKEWORD(2, 2), &wsaData) == 0;
#else
    return true;
#endif
}

void cleanupNetwork() {
#ifdef _WIN32
    WSACleanup();
#endif
}

int main() {
    g_root = findProjectRoot();
    ensureMemoryFiles();

    if (!initNetwork()) {
        std::cerr << "Failed to initialize networking.\n";
        return 1;
    }

    socket_t server = socket(AF_INET, SOCK_STREAM, 0);
#ifdef _WIN32
    if (server == INVALID_SOCKET) {
#else
    if (server < 0) {
#endif
        std::cerr << "Failed to create socket.\n";
        cleanupNetwork();
        return 1;
    }

    int reuse = 1;
#ifdef _WIN32
    setsockopt(server, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&reuse), sizeof(reuse));
#else
    setsockopt(server, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse));
#endif

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    address.sin_port = htons(8080);

    if (bind(server, reinterpret_cast<sockaddr*>(&address), sizeof(address)) != 0) {
        std::cerr << "Port 8080 is unavailable. Stop the process using it or change the port in backend/main.cpp.\n";
        closeSocket(server);
        cleanupNetwork();
        return 1;
    }

    if (listen(server, 16) != 0) {
        std::cerr << "Failed to listen on port 8080.\n";
        closeSocket(server);
        cleanupNetwork();
        return 1;
    }

    std::cout << "Atlas backend running at http://127.0.0.1:8080\n";
    std::cout << "Project root: " << g_root.string() << "\n";

    while (true) {
        sockaddr_in clientAddress{};
#ifdef _WIN32
        int clientLength = sizeof(clientAddress);
#else
        socklen_t clientLength = sizeof(clientAddress);
#endif
        socket_t client = accept(server, reinterpret_cast<sockaddr*>(&clientAddress), &clientLength);
#ifdef _WIN32
        if (client == INVALID_SOCKET) {
#else
        if (client < 0) {
#endif
            continue;
        }

        std::thread([client]() {
            std::string raw = readHttpMessage(client);
            if (!raw.empty()) {
                HttpRequest request = parseRequest(raw);
                std::string reply = handleRequest(request);
                sendAll(client, reply);
            }
            closeSocket(client);
        }).detach();
    }

    closeSocket(server);
    cleanupNetwork();
    return 0;
}
