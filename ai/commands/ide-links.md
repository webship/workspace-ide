---
description: Give the addresses that open a Webship Workspace project in an editor — the Web IDE in the browser, Visual Studio Code and IntelliJ IDEA on the machine, and the path for a terminal — the same ones the IDE menu of the project offers. Read-only; nothing is opened or changed.
argument-hint: '<project>'
---

# /ide-links

Give the addresses that open this project in an editor: `$ARGUMENTS`

The argument is one word: the project, which is its folder name in a workspace folder. With no
project, stop and ask for one.

The workspace is container-based (DDEV by default). This command only reads: it builds the
addresses the IDE menu of the Web IDE plugin (`@webship.co/workspace-ide`) offers, and opens nothing.

## 1. Find the project and the name of the dashboard

```bash
ls -d ~/workspace/*/<project>
cd ~/workspace/<folder>/<project> && pwd
grep -E '^hub_domain:' ~/workspace/core/config/settings.yml
```

`pwd` gives the full path of the project. `hub_domain` is `workspace.ddev.site` when the line is
missing.

## 2. Is the Web IDE up

```bash
docker exec ddev-workspace-web supervisorctl status
```

Read the line `webextradaemons:code-server`. If it does not say `RUNNING`, say so beside the first
address; do not restart anything.

## 3. Report

Four lines, with the path of the project filled in (encoded in the first and the third):

1. Web IDE, in the browser, from any device: `https://ide.<hub_domain>/?folder=<the path>`
2. Visual Studio Code, on the machine the browser is on: `vscode://file<the path>`
3. IntelliJ IDEA, on the machine the browser is on: `jetbrains://idea/open?file=<the path>`
4. From a terminal on the machine: `code <the path>` or `idea <the path>`

Say that the second and the third open only where that editor is installed and has registered its
address, and only on the machine that holds the path.
