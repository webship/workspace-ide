---
name: ide-open-with
description: Open a project of a Webship Workspace in an editor the way the Web IDE plugin (`@webship.co/workspace-ide`) does — the IDE menu of a project row and of the files pages, the Web IDE in the browser (code-server in the dashboard's container, at `ide.<hub_domain>`), Visual Studio Code and IntelliJ IDEA on the machine the browser runs on, the address behind each entry, the path to copy, what the caption says, and what to check when the menu says the Web IDE is not running. Use when asked "open this project in the Web IDE", "give me the link to edit this folder", "the Web IDE is not running", "nothing happens when I click Visual Studio Code", or "what does code · git mean on a row".
argument-hint: '<project>'
---

# ide-open-with

Editors for a project of a Webship Workspace (`~/workspace`, container-based, DDEV by default). It
comes with the Web IDE plugin (`@webship.co/workspace-ide`), like the command `/ide-links` and the
prompt `ide-web-ide-check`.

## The IDE menu

Every project row carries the IDE menu, and so do the files pages. Its entries say where each
editor runs, which is the point of the menu: the first runs with the dashboard and works from any
device; the other two hand the folder to software installed on the machine the browser is on.

| Menu entry | Where it runs | The address |
| --- | --- | --- |
| **Web IDE** | Here, in the browser: code-server in the dashboard's container | `https://ide.<hub_domain>/?folder=<the path of the project>` |
| **Visual Studio Code** | On the machine you are browsing from | `vscode://file<the path of the project>` |
| **IntelliJ IDEA** | On the machine you are browsing from | `jetbrains://idea/open?file=<the path of the project>` |
| **Copy the path** | Copies the path of the project, for a terminal | `code <the path>` or `idea <the path>` |

`<hub_domain>` is the `hub_domain` of `core/config/settings.yml` (`workspace.ddev.site` unless it
was changed). The path is the full path of the project on the machine that runs the workspace, and
it is sent encoded in the first and the third address.

When the folder is a git repository the menu shows, on top, the branch and how many commits are
unpushed and how many files are changed; for a worktree, the checkout it belongs to.

The COMPOSER menu of a row also carries **Edit in the Web IDE**, while the Web IDE is up.

### The caption beside the menu

| Caption | What it means |
| --- | --- |
| `code` | The folder has no `.git` |
| `code · git` | The folder is a checkout |
| `code · worktree` | The folder is a worktree of another checkout |

## When the Web IDE is not running

The menu then shows "The Web IDE is not running" in place of the entry. code-server is a daemon
of the dashboard's container, bound to `127.0.0.1:8443` there, and the dashboard looks at that
port. To see what the daemon says, read only:

```bash
docker exec ddev-workspace-web supervisorctl status
```

The line `webextradaemons:code-server` should say `RUNNING`. Restarting the dashboard's container
(`ddev restart` in `core/workspace-app`) brings the daemon back, and it also ends every job the
dashboard is running: that is a decision for the person, never a step to take on your own.

## Turn it on

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require @webship.co/workspace-ide
bash core/scripts/plugins.sh --activate ide --with-needs     # adds the AI folders its items land in
bash core/scripts/plugins.sh --install ide
```

The plugin has no settings file and places no command. The daemon, its start script and its
address come with the dashboard's own image; the plugin draws the menus.

## Traps

- **Nothing happens on Visual Studio Code or IntelliJ IDEA**: the machine the browser is on has no
  handler for `vscode://` or `jetbrains://`. Copy the path and open it from a terminal there.
- **The path is the path on the workspace's machine.** Browsing from another machine, the two
  editors on that machine cannot open it; the Web IDE can.
- **The Web IDE answers on its own name**, `ide.<hub_domain>`, not under the dashboard's address.
