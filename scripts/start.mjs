// One-click launcher behind "Start FoodBridge.command" (Mac) and "Start FoodBridge.bat" (Windows).
// Gets the latest version, installs packages when they changed, makes sure Expo CLI is signed in,
// then starts the app with a tunnel so the iPhone can open it from any network.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const say = (text = '') => console.log(text ? `  ${text}` : '');
const fail = (text) => {
  say();
  say(text);
  process.exit(1);
};

say();
say('FoodBridge');
say('----------');

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor !== 24) {
  say(`Note: this app was tested with Node.js 24 and you have ${process.versions.node}.`);
  say('If something goes wrong, install Node.js 24 (README, step 2).');
}

// 1. Latest version from GitHub. Not fatal: offline, it just starts the copy on disk.
if (existsSync('.git')) {
  say('Checking for updates...');
  const head = () => spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout?.trim();
  const before = head();
  const pull = spawnSync('git', ['pull', '--ff-only', '--quiet'], { stdio: 'ignore', timeout: 60_000 });
  if (pull.error || pull.status !== 0) say('Could not check for updates, starting the version you have.');
  else say(head() === before ? 'Already up to date.' : 'Updated to the latest version.');
}

// 2. Packages, reinstalled only when package-lock.json changed since the last install.
const lockHash = createHash('sha256').update(readFileSync('package-lock.json')).digest('hex');
const stamp = join('node_modules', '.foodbridge-installed');
if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== lockHash) {
  say('Installing packages. Only needed the first time and after updates; takes a minute or two...');
  const install = spawnSync('npm ci --no-audit --no-fund --loglevel=error',{ shell: true, stdio: 'inherit' });
  if (install.status !== 0) {
    fail('Installing packages failed. Check the internet connection, close any other FoodBridge window, and try again.');
  }
  writeFileSync(stamp, lockHash);
}

// 3. Expo account. On an iPhone, Expo Go only opens the app when it uses the same account as this computer.
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

// 4. Start.
say();
say(`Signed in to Expo as "${account}".`);
say(`Expo Go on the iPhone must be signed in as "${account}" too (account icon, top right).`);
say();
say('In a few seconds a QR code appears below:');
say('  1. Open the Camera app on the iPhone and point it at the QR code.');
say('  2. Tap "Open in Expo Go". The first load takes about 20-30 seconds.');
say('Keep this window open while using the app. Close it to stop FoodBridge.');
say();

const server = expo(['start', '--tunnel'], { stdio: 'inherit' });
process.exit(server.status ?? 0);
