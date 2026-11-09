import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import net from 'net';

import { register, makeIdeProbe, IDE_BIND } from '../src/index';

function fakeApi() {
  const calls: any = { rowMenus: {}, openWith: [], links: [], fragments: [] };
  const api: any = {
    name: 'ide',
    lib: {
      esc: (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)),
      hubDomain: () => 'hub.example.test', tildePath: (p: string) => p,
      hasOwnGit: (dir: string) => dir.endsWith('/repo'),
      gitWorktreeInfo: (dir: string) => ({ role: 'linked', branch: 'feature', others: [], primary: '/w/main', unpushed: 2, dirty: 0 }),
    },
    addRowMenu: (slot: string, spec: any, fn: any) => { calls.rowMenus[slot] = { spec, fn }; },
    addOpenWith: (fn: any) => calls.openWith.push(fn),
    addFolderLink: (fn: any) => calls.links.push(fn),
    addFragment: (fn: any) => calls.fragments.push(fn),
  };
  return { api, calls };
}

test('the IDE binds to loopback, and the hostname follows hub_domain', () => {
  assert.strictEqual(IDE_BIND.host, '127.0.0.1');
  assert.strictEqual(typeof IDE_BIND.port, 'number');
  const { api, calls } = fakeApi();
  register(api);
  const html = calls.openWith[0]('/w/dev/site1', { label: 'IDE', caption: 'files' });
  assert.match(html, /https:\/\/ide\.hub\.example\.test\/\?folder=%2Fw%2Fdev%2Fsite1/);
});

test('the menu names where each editor runs, and offers the path to copy', () => {
  const { api, calls } = fakeApi();
  register(api);
  const html = calls.openWith[0]('/w/dev/site1', { caption: 'files' });
  assert.match(html, /Here, in the browser/);
  assert.match(html, /On the machine you are browsing from/);
  assert.match(html, /vscode:\/\/file\/w\/dev\/site1/);
  assert.match(html, /jetbrains:\/\/idea\/open\?file=%2Fw%2Fdev%2Fsite1/);
  assert.match(html, /data-copy="\/w\/dev\/site1"/);
  assert.match(html, /act-status uk-text-meta">files</);
});

test('the row slot puts git inside the menu and only the repository fact in the caption', () => {
  const { api, calls } = fakeApi();
  register(api);
  assert.deepStrictEqual(calls.rowMenus.ide.spec, { label: 'IDE', row: 0 });
  const withGit = calls.rowMenus.ide.fn({ key: 'dev', project: 'repo', dir: '/w/dev', meta: {}, allowed: new Set(), vals: () => '' });
  assert.match(withGit, /code · worktree</);
  assert.match(withGit, /Git worktree/);
  assert.match(withGit, /feature · 2 unpushed/);
  const plain = calls.rowMenus.ide.fn({ key: 'dev', project: 'plain', dir: '/w/dev', meta: {}, allowed: new Set(), vals: () => '' });
  assert.match(plain, /act-status uk-text-meta">code</);
  assert.doesNotMatch(plain, /uk-nav-header">Git/);
});

test('the probe answers "up" before it knows, then the truth, and the folder link follows it', async () => {
  const server = net.createServer().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const port = (server.address() as net.AddressInfo).port;
  const up = makeIdeProbe({ host: '127.0.0.1', port }, 50);
  assert.strictEqual(up(), true, 'the first paint assumes up');
  await new Promise((r) => setTimeout(r, 200));
  assert.strictEqual(up(), true);
  server.close();
  await new Promise((r) => setTimeout(r, 100));
  const down = makeIdeProbe({ host: '127.0.0.1', port }, 50);
  down();
  await new Promise((r) => setTimeout(r, 200));
  assert.strictEqual(down(), false, 'nothing listens there any more');
  const { api, calls } = fakeApi();
  register(api);
  const link = calls.links[0]('/w/dev/site1');
  assert.ok(link === null || /Edit in the Web IDE/.test(link.label));
});

test('on a dashboard that fetches menu bodies, the row costs a button and one stat, and the fragment serves the items', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ide-plugin-'));
  fs.mkdirSync(path.join(root, 'dev/checkout/.git'), { recursive: true });
  fs.mkdirSync(path.join(root, 'dev/worktree'), { recursive: true });
  fs.writeFileSync(path.join(root, 'dev/worktree/.git'), 'gitdir: /elsewhere\n');
  fs.mkdirSync(path.join(root, 'dev/plain'), { recursive: true });
  const { api, calls } = fakeApi();
  api.capabilities = new Set(['row-menu-body']);
  api.lib.workspaceDir = (ws: string) => path.join(root, ws);
  api.lib.NAME_RE = /^[a-zA-Z0-9_-]+$/;
  api.lib.hasOwnGit = (dir: string) => fs.existsSync(path.join(dir, '.git'));
  register(api);
  const ctx = (project: string) => ({ key: 'dev', project, dir: path.join(root, 'dev'), meta: {}, allowed: new Set(), vals: () => '' });
  const checkout = calls.rowMenus.ide.fn(ctx('checkout'));
  assert.strictEqual(checkout.body, '/fragments/p/ide/menu/dev/checkout');
  assert.strictEqual(checkout.caption, 'code · git');
  assert.match(checkout.html, /> IDE </);
  assert.doesNotMatch(checkout.html, /uk-dropdown|vscode:\/\//, 'the page carries the button alone');
  assert.strictEqual(calls.rowMenus.ide.fn(ctx('worktree')).caption, 'code · worktree');
  assert.strictEqual(calls.rowMenus.ide.fn(ctx('plain')).caption, 'code');
  let out = { html: '', status: 200 };
  const send = (html: string, status = 200) => { out = { html, status }; };
  calls.fragments[0]({ send, rest: 'menu/dev/checkout' });
  assert.strictEqual(out.status, 200);
  assert.match(out.html, /^<ul class="uk-nav uk-dropdown-nav">/);
  assert.match(out.html, /Git worktree/, 'the fake git says linked: the facts are in the body');
  assert.match(out.html, new RegExp(`vscode://file${path.join(root, 'dev/checkout')}`));
  calls.fragments[0]({ send, rest: 'menu/dev/plain' });
  assert.doesNotMatch(out.html, /uk-nav-header">Git/);
  calls.fragments[0]({ send, rest: 'menu/dev/missing' });
  assert.strictEqual(out.status, 404);
  fs.rmSync(root, { recursive: true, force: true });
});
