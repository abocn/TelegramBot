#!/bin/bash

# CLEANUP.SH
# by ihatenodejs/Aidan
#
# -----------------------------------------------------------------------
#
# This is free and unencumbered software released into the public domain.
#
# Anyone is free to copy, modify, publish, use, compile, sell, or
# distribute this software, either in source code form or as a compiled
# binary, for any purpose, commercial or non-commercial, and by any
# means.
#
# In jurisdictions that recognize copyright laws, the author or authors
# of this software dedicate any and all copyright interest in the
# software to the public domain. We make this dedication for the benefit
# of the public at large and to the detriment of our heirs and
# successors. We intend this dedication to be an overt act of
# relinquishment in perpetuity of all present and future rights to this
# software under copyright law.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
# OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
# ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
# OTHER DEALINGS IN THE SOFTWARE.
#
# For more information, please refer to <https://unlicense.org/>

LOG_FILE="/shared/cleanup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup_database() {
    log "[DB] Starting database cleanup..."

    bun /shared/tools/cleanup-database.ts

    if [ $? -eq 0 ]; then
        log "[DB] Database cleanup completed successfully"
    else
        log "[DB] Database cleanup failed"
    fi
}

cleanup_valkey() {
    log "[VALKEY] Starting Valkey cleanup..."

    if [ -f "/shared/webui/tools/cleanup-valkey.ts" ]; then
        cd /shared/webui && npx tsx tools/cleanup-valkey.ts

        if [ $? -eq 0 ]; then
            log "[VALKEY] Valkey cleanup completed successfully"
        else
            log "[VALKEY] Valkey cleanup failed"
        fi
    else
        log "[VALKEY] Valkey cleanup script not found, skipping"
    fi
}

main() {
    log "=== Starting cleanup cycle ==="

    cleanup_database
    cleanup_valkey

    log "=== Cleanup cycle complete ==="
}

if [ "$1" = "--once" ]; then
    main
else
    while true; do
        main
        sleep 1800
    done
fi