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
bash core/scripts/plugins.sh --activate ide --with-needs
bash core/scripts/plugins.sh --install ide
```

The `workspacePlugin` block in `package.json` is the manifest the installer reads.

## The items it carries

The workspace is container-based (DDEV by default). Each item lands in the folder of its kind, when
that folder is an active workspace folder, is listed there like any other item, and is installed
into Claude Code from there:

| What | Lands in | What it is for |
| --- | --- | --- |
| The skill `ide-open-with` | `ai-skills/` | Every entry of the IDE menu, where each editor runs and the address behind it, the caption, and what to check when the Web IDE is not running |
| The command `/ide-links` | `ai-commands/` | `/ide-links <project>`: the addresses that open a project in the Web IDE, Visual Studio Code and IntelliJ IDEA, and the path for a terminal. Read-only |
| The prompt `ide-web-ide-check` | `ai-prompts/` | The launch command of a session that finds out why the Web IDE is not running, without restarting anything |

The plugin ships no agent: it opens editors, and there is no work to hand to one. It places no `cmd-*.sh`: an editor is opened from a browser, or with `code <path>` on the machine. The item bodies are plain Markdown any AI command-line assistant can follow; Claude Code is the default shape (frontmatter, the launch command of the prompt).

How the items are laid out and checked: [docs/plugin-items-pattern.md](docs/plugin-items-pattern.md).

## What it needs

It needs the AI folders its items are placed in (`needs`): `ai-skills`, `ai-commands` and `ai-prompts`. `--require` says so, `--activate` and `--install` stop until the workspace has them, and `--with-needs` adds what is missing first. A kind whose folder is not an active workspace folder is skipped, and the install says so.

## What the package holds of them

| Path | What it is |
| --- | --- |
| `ai/skills/ide-open-with/` | The skill `ide-open-with` |
| `ai/commands/ide-links.md` | The command `/ide-links` |
| `ai/prompts/ide-web-ide-check.md` | The prompt `ide-web-ide-check` |
| `tests/items.test.ts` | The shape of every item, and that it names nothing the plugin does not have |
