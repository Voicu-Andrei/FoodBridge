# FoodBridge

**Too Good To Go, but business-to-business.** Munich restaurants, bakeries and caterers post today's
surplus ingredients; nearby kitchens, canteens and food banks reserve them and either pick them up by
bike or book FoodBridge's electric delivery.

This is a showcase prototype built with [Expo](https://expo.dev) (SDK 58) and runs in **Expo Go** on an
iPhone. All data is mock data stored on the phone; no real payments, bank details or messages are sent
anywhere.

## Features

- **Onboarding**: three animated intro slides, then log in as a sample business or register your own.
- **Offers feed**: live market stats, search, category filters, sort by distance / ending soon / best deal,
  and a pickup-or-delivery recommendation on every card.
- **Offer detail**: zoom transition from the card, live pickup countdown, pickup vs. delivery comparison,
  and **slide to reserve**.
- **Reservation ticket**: animated confirmation with confetti, a pickup code and a QR code.
- **Live map**: real Munich map with category pins, your pickup radius, and a card carousel synced to the pins.
- **Delivery tracking**: a van drives the route to you, with live ETA and progress steps.
- **Post surplus**: take a photo, set price and pickup window, with a live preview of the card.
- **Orders**: purchases (with QR codes and tracking), sales, and your own offers (edit / remove).
- **Wallet**: animated balance, top-up, connect a demo bank and pay out, activity history.
- **Impact**: Munich-wide food rescued this week, meals and CO₂e, a 7-day chart, and a leaderboard.
- **Live marketplace**: new offers from other businesses appear on their own, with an in-app banner.
- **English / Deutsch** throughout, light and dark mode.

---

# How to run it (step by step)

You run a small development server on your computer (Windows or Mac) and open the app on your iPhone
with **Expo Go**. Steps 1–2 are one-time setup; after that you only need [step 4](#step-4--start-the-app).

**You need:** an iPhone, a Windows PC or a Mac, internet on both, and a free Expo account.

## Step 1 — Set up the iPhone (one time)

1. Install **Expo Go** from the App Store (or update it if you already have it).
2. Create a free Expo account at <https://expo.dev/signup> (skip if you have one).
3. Open Expo Go, tap the **account icon** (top right) and **sign in** with that account.

> **Important:** the computer must be signed in to the **same Expo account** as Expo Go on the phone
> (you do that in step 3). Everyone uses their own account; the project isn't tied to anyone's.

## Step 2 — Install the tools on your computer (one time)

The app was built and tested with **Node.js 24** (see `.nvmrc`). You also need **Git**.

Check first. If both commands print a version (Node `v24.x`), skip to step 3:

```bash
git --version
```
```bash
node -v
```

### Windows

Open **PowerShell** (Start menu → type "PowerShell" → Enter) and run these one at a time:

```powershell
winget install --id Git.Git -e --source winget
```
```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget --version 24.22.1
```

**Close PowerShell and open a new one** so it picks up the new tools, then check:

```powershell
node -v
```

> If PowerShell later says *"npx.ps1 cannot be loaded because running scripts is disabled on this
> system"*, run this once, then try again:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

No winget? Download the installers instead: Git from <https://git-scm.com/download/win> and
Node.js **v24** from <https://nodejs.org/en/download> (choose version 24 → Windows Installer).

### Mac

Open **Terminal** (Cmd + Space → type "Terminal" → Enter) and run these one at a time.

1. Install **Homebrew** (skip if `brew -v` works). This also installs Git (Apple's command line tools);
   it asks for your Mac password and may take a few minutes:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

   When it finishes, run the two lines it prints under "Next steps" to add `brew` to your PATH.
   On an Apple silicon Mac (M1 or newer) they are:

   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
   ```
   ```bash
   eval "$(/opt/homebrew/bin/brew shellenv)"
   ```

2. Install **Node.js 24** and put it on your PATH:

   ```bash
   brew install node@24
   ```
   ```bash
   echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
   ```

   (On an older Intel Mac, use `/usr/local/opt/node@24/bin` instead of `/opt/homebrew/opt/node@24/bin`.)

3. **Close Terminal and open a new window**, then check:

   ```bash
   node -v
   ```
   ```bash
   git --version
   ```

No Homebrew? Download Node.js **v24** from <https://nodejs.org/en/download> (choose version 24 →
macOS Installer), and run `xcode-select --install` to get Git.

## Step 3 — Download the app and sign in (one time)

These commands are the same on **Windows (PowerShell)** and **Mac (Terminal)**. Run them one at a time.

1. Download the code into a folder called `FoodBridge` and go into it:

   ```bash
   git clone https://github.com/Voicu-Andrei/FoodBridge.git
   ```
   ```bash
   cd FoodBridge
   ```

2. Install the app's packages (takes a minute or two; warnings about "vulnerabilities" or "funding"
   are normal and can be ignored):

   ```bash
   npm ci
   ```

3. Sign in to Expo with **the same account you used in Expo Go** on your phone:

   ```bash
   npx expo login
   ```

4. Check which account you're signed in with. It must match the one in Expo Go:

   ```bash
   npx expo whoami
   ```

## Step 4 — Start the app

From inside the `FoodBridge` folder, run:

```bash
npx expo start --tunnel
```

After a few seconds a **QR code** appears in the window.

1. On the iPhone, open the **Camera** app and point it at the QR code.
2. Tap the **Open in Expo Go** banner. The first load takes about 20–30 seconds.
3. Keep the PowerShell / Terminal window open while you use the app. Press **Ctrl + C** in it to stop.

`--tunnel` works on any network (home, university, mobile hotspot). If the phone and computer are on
the **same Wi-Fi**, plain `npx expo start` loads faster. On a Mac, click **Allow** if macOS asks whether
"node" may accept incoming connections.

**Every time you start the server you get a new QR code.** Always scan the one that's currently on
screen; an old one gives an error.

### Next time

```bash
cd FoodBridge
```
```bash
npx expo start --tunnel
```

To get the latest version of the app first, run `git pull` and then `npm ci` inside the folder.

### iOS Simulator (Mac only, optional)

If Xcode is installed, press **i** in the terminal after `npx expo start` to open the app in the iOS
Simulator. The simulator doesn't need the Expo account check.

## Logging in to the demo

On the app's login screen, **tap any sample business** and its details are filled in for you. Or type
one in, for example `owner@panera-schwabing.de` with password `demo1234` (every sample business uses
`demo1234`). You can also register a new business.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| *"You're signed in to Expo CLI as X and to Expo Go as Y — these accounts need to match"* | Sign Expo Go (account icon, top right) in to the account `npx expo whoami` shows, or run `npx expo login` with the Expo Go account. If you switched the computer's account, stop the server (Ctrl + C) and start it again. |
| *"…but not signed in to Expo Go"* or *"…not signed in to Expo CLI"* | Sign in on the side that's missing (step 1 for the phone, `npx expo login` for the computer), then tap **Try Again**. |
| *"There was a problem running the requested project"* / **502 Bad Gateway** | The QR code is old or the server stopped. Make sure `npx expo start --tunnel` is running and scan the QR code currently on screen. |
| *"Project is incompatible with this version of Expo Go"* | Update Expo Go from the App Store. |
| *"npx.ps1 cannot be loaded because running scripts is disabled"* (Windows) | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, then try again. |
| `node` or `git` "is not recognized" / "command not found" | Close the terminal and open a new one after installing. On Mac, check the PATH line in step 2. |
| Anything else odd, or the app shows old code | Stop the server and start it with a clean cache: `npx expo start --tunnel --clear` |

---

## Presenter mode

**Long-press the FoodBridge logo** on the Offers tab to open hidden demo controls:

- Drop a new offer right now (shows the "new nearby" banner)
- Turn the live marketplace on/off and set how often offers appear (15 s / 40 s / 90 s)
- Delivery speed for tracking (30 s / 75 s / 3 min) and "finish all deliveries now"
- Add €100 to the current wallet
- Switch language
- Replay onboarding, or reset all demo data

Suggested demo flow: log in → scroll the feed → open an offer → slide to reserve with delivery →
track the van → switch to the Map tab → post surplus with a camera photo → show it from another
business (tap the avatar to switch) → Impact tab.

## Notes for the presentation

- The impact figures are **demo values**. The assumptions (kg per meal, CO₂e per kg, weekly goal) live in
  `src/lib/impact.ts` (`IMPACT`); replace them with sourced figures before presenting
  them as facts.
- The app depends on the laptop running `npx expo start`. Rehearse on the venue network (or a phone
  hotspot with `--tunnel`) and keep a screen recording as a backup.

## Project structure

```
src/app/            screens (Expo Router, file-based routes)
  (tabs)/           Offers, Map, Orders, Impact, Account
  offer/[id].tsx    offer detail + slide to reserve
  reserved/, track/, order/   reservation ticket, delivery tracking, QR order sheet
  publish.tsx, top-up.tsx, presenter.tsx, intro.tsx, login.tsx
src/components/     UI building blocks (cards, map, chart, slider, …)
src/store/          app state (zustand, persisted on the device)
src/data/           seed data: districts, businesses, offers
src/i18n/           English and German strings
src/constants/      theme (colors, fonts) and motion
```

Useful commands: `npm run typecheck`, `npm run lint`, `npx expo-doctor`.
