# @webship.co/workspace-ide

The Web IDE for the [Webship Workspace](https://github.com/webship/workspace) dashboard: the **IDE**
menu on every project row and files page — VS Code in the browser (code-server, a daemon in the
dashboard container, proxied at `ide.<hub_domain>`), or Visual Studio Code and IntelliJ IDEA on the
machine the browser runs on, with the path to copy — and the "Edit in the Web IDE" link inside the
COMPOSER menu. A cached loopback probe turns the Web IDE item into the reason when the daemon is down.

The daemon itself (code-server, its start script, the nginx vhost) stays with the dashboard image;
this plugin draws the menus and expects it at `127.0.0.1:8443`.

## Use it

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require github:webship/workspace-ide
bash core/scripts/plugins.sh --activate ide
bash core/scripts/plugins.sh --install ide
```

The `workspacePlugin` block in `package.json` is the manifest the installer reads.
