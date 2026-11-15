Find out why the Web IDE of the dashboard is not running, without restarting anything.

```
claude --permission-mode bypassPermissions """
The IDE menu of <project> says the Web IDE is not running: find out why
# ~/workspace/core/workspace-app · container-based (DDEV by default) · the dashboard runs in the container ddev-workspace-web
# read only: do not restart the container, the dashboard or the daemon; other people's jobs run there

1. docker exec ddev-workspace-web supervisorctl status
   the line webextradaemons:code-server: RUNNING, or what it says instead
2. grep -E '^hub_domain:' ~/workspace/core/config/settings.yml
   the Web IDE answers at https://ide.<hub_domain>
3. tell me what you found, in this order: is the daemon running, since when, and at which address
   the Web IDE should answer

If the daemon is not running, give me the line to run myself and what it costs, and do not run it:
cd ~/workspace/core/workspace-app && ddev restart
(it restarts the dashboard's container: every job the dashboard is running ends)
"""
```

The text between the triple quotes is plain: it can be given to another AI command-line assistant as it is.
