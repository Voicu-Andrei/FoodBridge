// One-click launcher behind "Start FoodBridge.command" (Mac) and "Start FoodBridge.bat" (Windows).
// Checks the internet connection, gets the latest version, installs packages when they changed,
// makes sure Expo CLI is signed in, then starts the app with a tunnel so the iPhone can open it
// from any network (the phone and computer don't need to share a Wi-Fi).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const say = (text = '') => console.log(text ? `  ${text}` : '');
const fail = (text) => {
  say();
  say(text);
  process.exit(1);
};
const ask = async (question) => {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  await prompt.question(`  ${question}`);
  prompt.close();
};
const sayHotspotTip = () => {
  say('  - On university or public Wi-Fi, open any website in the browser first, in case the Wi-Fi');
  say('    needs a login.');
  say('  - Still not working? The Wi-Fi may block the connection. Turn on Personal Hotspot on the');
  say('    iPhone (Settings > Personal Hotspot), connect this computer to it, and try again.');
};

// Any HTTP answer counts; only a network or TLS error (offline, Wi-Fi login page, blocked) fails.
const expoReachable = async () => {
  try {
    await fetch('https://api.expo.dev/', { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    return true;
  } catch {
    return false;
  }
};

say();
say('FoodBridge');
say('----------');

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor !== 24) {
  say(`Note: this app was tested with Node.js 24 and you have ${process.versions.node}.`);
  say('If something goes wrong, install Node.js 24 (README, step 2).');
}

// 1. Internet. The tunnel, the Expo sign-in and package installs all need Expo's servers.
say('Checking the internet connection...');
while (!(await expoReachable())) {
  say();
  say("Can't reach Expo's servers, so FoodBridge can't start yet.");
  sayHotspotTip();
  say();
  await ask('Press Enter to try again (or close this window to stop).');
}

// Set when the fallback `npm install` below had to rewrite package-lock.json.
const repairedMarker = join('node_modules', '.foodbridge-repaired');

// 2. Latest version from GitHub. Not fatal: it just starts the copy on disk.
if (existsSync('.git')) {
  say('Checking for updates...');
  const head = () => spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout?.trim();
  const before = head();
  // Undo the fallback's lockfile rewrite so the pull can't conflict with it.
  if (existsSync(repairedMarker)) spawnSync('git', ['checkout', '--', 'package-lock.json'], { stdio: 'ignore' });
  const pull = spawnSync('git', ['pull', '--ff-only', '--quiet'], { stdio: 'ignore', timeout: 60_000 });
  if (pull.error || pull.status !== 0) say('Could not check for updates, starting the version you have.');
  else say(head() === before ? 'Already up to date.' : 'Updated to the latest version.');
}

// 3. Packages, reinstalled only when package-lock.json changed since the last install.
const lockHash = createHash('sha256').update(readFileSync('package-lock.json')).digest('hex');
const stamp = join('node_modules', '.foodbridge-installed');
if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== lockHash) {
  say('Installing packages. Only needed the first time and after updates; takes a minute or two...');
  let install = spawnSync('npm ci --no-audit --no-fund --loglevel=error', { shell: true, encoding: 'utf8' });
  if (install.status !== 0) {
    // Different npm versions can disagree about the lockfile; `npm install` repairs it instead of refusing.
    say('Retrying with a repair install...');
    install = spawnSync('npm install --no-audit --no-fund --loglevel=error', { shell: true, stdio: 'inherit' });
    if (install.status === 0) writeFileSync(repairedMarker, '');
  }
  if (install.status !== 0) {
    fail('Installing packages failed. Check the internet connection, close any other FoodBridge window, and try again.');
  }
  writeFileSync(stamp, lockHash);
}

// 4. Expo account. On an iPhone, Expo Go only opens the app when it uses the same account as this computer.
const expoCli = join(root, 'node_modules', 'expo', 'bin', 'cli');
const expo = (args, options) => spawnSync(process.execPath, [expoCli, ...args], options);
const whoami = () => {
  const result = expo(['whoami'], { encoding: 'utf8' });
  const name = result.stdout?.trim().split(/\r?\n/).pop() ?? '';
  return result.status === 0 && name && !/not logged in/i.test(name) ? name : null;
};

let account = whoami();
if (!account) {
  say();
  say('Sign in to Expo with the SAME account that Expo Go on the iPhone uses.');
  say('No account yet? Create a free one at https://expo.dev/signup');
  say();
  expo(['login'], { stdio: 'inherit' });
  account = whoami();
  if (!account) fail('Not signed in to Expo. Close this window and double-click Start FoodBridge again.');
}

// 5. Start.
say();
say(`Signed in to Expo as "${account}".`);
say(`Expo Go on the iPhone must be signed in as "${account}" too (account icon, top right).`);
say('The iPhone does not need to be on the same Wi-Fi as this computer; mobile data works too.');
say();
say('In a few seconds a QR code appears below:');
say('  1. Open the Camera app on the iPhone and point it at the QR code.');
say('  2. Tap "Open in Expo Go". The first load takes about 20-30 seconds.');
say('Keep this window open while using the app. Close it to stop FoodBridge.');
say();

const startedAt = Date.now();
const server = expo(['start', '--tunnel'], { stdio: 'inherit' });
// Expo exits on its own while starting when the tunnel can't connect, usually because of the network.
if (server.status !== 0 && Date.now() - startedAt < 120_000) {
  say();
  say('FoodBridge stopped while starting. This is usually the network:');
  sayHotspotTip();
  say('Then double-click Start FoodBridge again.');
}
process.exit(server.status ?? 0);
