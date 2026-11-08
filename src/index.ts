/**
 * The Web IDE for Webship Workspace.
 *
 * "Open with": the Web IDE here (code-server, a daemon in the dashboard container, bound to loopback
 * and proxied at ide.<hub_domain>), or an editor on the machine the browser is running on. Modelled
 * on GitLab's Code menu, and it keeps GitLab's distinction, which is the whole point: the Web IDE runs
 * HERE and works from any device, while the other two hand off to software installed where the
 * BROWSER is. A link that silently does nothing is worse than no link, so each is labelled with which
 * it is and a copyable path is offered for the case where no URL handler is registered.
 *
 * The IDE can be down on its own (an image rebuilt but not restarted, a crash) while the dashboard
 * beside it is fine, so a cached TCP probe decides whether the item is a link or the reason.
 */

import net from 'net';
import type { PluginApi, RowContext } from '@webship.co/workspace-plugin-api';

/** Where code-server binds inside the container; the dashboard's nginx vhost proxies ide.<hub> to it. */
export const IDE_BIND = { host: '127.0.0.1', port: 8443 };
export const IDE_TTL = 10 * 1000;

export function makeIdeProbe(bind = IDE_BIND, ttl = IDE_TTL) {
  let state = { at: 0, up: false, checked: false };
  return function ideUp(): boolean {
    if (state.checked && Date.now() - state.at < ttl) return state.up;
    // Kick off a refresh and answer from the last result: the row renderers are synchronous.
    const sock = new net.Socket();
    let settled = false;
    const done = (up: boolean) => { if (settled) return; settled = true; state = { at: Date.now(), up, checked: true }; sock.destroy(); };
    sock.setTimeout(1500);
    sock.once('connect', () => done(true));
    sock.once('timeout', () => done(false));
    sock.once('error', () => done(false));
    try { sock.connect(bind.port, bind.host); } catch (_) { done(false); }
    // First call has no answer yet: assume up, so a slow first paint never hides the button
    // that is almost certainly fine. The next render has the truth.
    return state.checked ? state.up : true;
  };
}

export function register(api: PluginApi): void {
  const { esc, hubDomain, tildePath, hasOwnGit, gitWorktreeInfo } = api.lib as any;
  const ideUp = makeIdeProbe();
  const ideBaseUrl = () => `https://ide.${hubDomain()}`;
  const ideUrl = (abs: string) => `${ideBaseUrl()}/?folder=${encodeURIComponent(abs)}`;

  function openWithMenuHtml(abs: string, { label = 'IDE', caption = 'code', git = null }: { label?: string; caption?: string; git?: any } = {}): string {
    // What git says about the folder belongs INSIDE the menu, not in the caption: the caption is a
    // one-word status and a branch name is neither short nor stable.
    const gitHead = (git && git.role !== 'none') ? `
      <li class="uk-nav-header">${git.role === 'linked' ? 'Git worktree' : 'Git'}</li>
      <li data-entry="branch"><span class="uk-text-meta"><span uk-icon="icon: git-branch; ratio: .7"></span>
        ${esc(git.branch || 'a detached HEAD')}${git.unpushed ? ` · ${git.unpushed} unpushed` : ''}${git.dirty ? ` · ${git.dirty} changed` : ''}</span></li>
      ${git.role === 'linked' ? `<li data-entry="worktree of"><span class="uk-text-meta">of <code>${esc(tildePath(git.primary))}</code></span></li>` : ''}
      ${git.role === 'primary' ? `<li data-entry="worktrees"><span class="uk-text-meta">${git.others.length} worktree(s) live off this checkout</span></li>` : ''}
      <li class="uk-nav-divider"></li>` : '';
    return `<span class="act-with-status"><div class="uk-inline act-menu act-menu-ide">
    <button class="uk-button uk-button-default uk-button-small" type="button"
      title="Open this in the browser IDE, or hand it to an editor on your own machine"><span uk-icon="icon: code; ratio: .7"></span> ${esc(label)} <span uk-icon="icon: chevron-down; ratio: .6"></span></button>
    <div uk-dropdown="mode: click; pos: bottom-right"><ul class="uk-nav uk-dropdown-nav">
      ${gitHead}
      <li class="uk-nav-header">Here, in the browser</li>
      ${ideUp()
    ? `<li><a href="${esc(ideUrl(abs))}" target="_blank" rel="noopener"
             title="VS Code in the browser, served by this dashboard — works from any device"><span uk-icon="icon: code; ratio: .7"></span> Web IDE</a></li>`
    : `<li><span class="uk-text-meta ide-unavailable">The Web IDE is not running. Its daemon lives in this container — <code>ddev restart</code>, or <code>docker exec ddev-workspace-web supervisorctl status</code></span></li>`}
      <li class="uk-nav-divider"></li>
      <li class="uk-nav-header">On the machine you are browsing from</li>
      <li><a href="vscode://file${esc(abs)}"
             title="Opens the VS Code installed on YOUR machine. Needs the vscode:// handler, which VS Code registers when it is installed."><span uk-icon="icon: desktop; ratio: .7"></span> Visual Studio Code</a></li>
      <li><a href="jetbrains://idea/open?file=${encodeURIComponent(abs)}"
             title="Opens IntelliJ IDEA on YOUR machine. Needs the JetBrains Toolbox URL handler; if nothing happens, copy the path below and run: idea <path>"><span uk-icon="icon: desktop; ratio: .7"></span> IntelliJ IDEA</a></li>
      <li class="uk-nav-divider"></li>
      <li><a href="#" class="copy-cmd" data-copy="${esc(abs)}"
             title="Copy the path — for: code ${esc(abs)}  ·  idea ${esc(abs)}  (a terminal needs no URL handler)"><span uk-icon="icon: copy; ratio: .7"></span> Copy the path</a></li>
    </ul></div>
  </div><span class="act-status uk-text-meta">${esc(caption)}</span></span>`;
  }

  // The files pages and the images gallery ask for the menu by folder.
  (api as any).addOpenWith((abs: string, opts: any) => openWithMenuHtml(abs, opts));
  // Inside the COMPOSER menu: edit this folder in the Web IDE, when it is up.
  (api as any).addFolderLink((abs: string) => (ideUp() ? { href: ideUrl(abs), label: 'Edit in the Web IDE', icon: 'code', title: 'The Web IDE, opened on this folder' } : null));

  // The IDE slot on a project row. The caption says only WHETHER there is a repository (that decides
  // whether the clone form can offer a worktree); the branch is in the menu.
  api.addRowMenu('ide', { label: 'IDE', row: 0 }, ({ project, dir }: RowContext) => {
    const projectPath = `${dir}/${project}`;
    const g = hasOwnGit(projectPath) ? gitWorktreeInfo(projectPath) : { role: 'none', branch: '', others: [], primary: '', unpushed: 0, dirty: 0 };
    const caption = g.role === 'none' ? 'code' : (g.role === 'linked' ? 'code · worktree' : 'code · git');
    return openWithMenuHtml(projectPath, { caption, git: g });
  });
}
