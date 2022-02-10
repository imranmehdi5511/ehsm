/*
 * Copyright (C) 2011-2020 Intel Corporation. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in
 *     the documentation and/or other materials provided with the
 *     distribution.
 *   * Neither the name of Intel Corporation nor the names of its
 *     contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

#ifndef _LOG_UTILS_H
#define _LOG_UTILS_H

#include <stdio.h>
#include <stdarg.h>

#define IS_DEBUG false



/*
    print info
*/
#define log_i(format, args...)                                           \
    {                                                                      \
        printf("INFO [%d]\t[%s -> %s]: ", __LINE__, __FILE__, __FUNCTION__); \
        printf(format, ##args);                                            \
        printf("\n");                                                      \
    }
/*
    print debug
*/
#define log_d(format, args...)                                                \
    {                                                                           \
        if (IS_DEBUG)                                                           \
        {                                                                       \
            printf("DEBUG [%d]\t[%s -> %s]: ", __LINE__, __FILE__, __FUNCTION__); \
            printf(format, ##args);                                             \
            printf("\n");                                                       \
        }                                                                       \
    }
/*
    print warn
*/
#define log_w(format, args...)                                           \
    {                                                                      \
        printf("WARN [%d]\t[%s -> %s]: ", __LINE__, __FILE__, __FUNCTION__); \
        printf(format, ##args);                                            \
        printf("\n");                                                      \
    }
/*
    print error
*/
#define log_e(format, args...)                                            \
    {                                                                       \
        printf("ERROR [%d]\t[%s -> %s]: ", __LINE__, __FILE__, __FUNCTION__); \
        printf(format, ##args);                                             \
        printf("\n");                                                       \
    }

#endif