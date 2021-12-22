#ifndef METHODS_HPP_INCLUDED
#define METHODS_HPP_INCLUDED

#include <string>

struct ProsusMethod {
    const char *name;
    std::string (*method)(const std::string &args);
};
extern const ProsusMethod ProsusMethods[];
extern const unsigned ProsusMethodCount;

#endif
