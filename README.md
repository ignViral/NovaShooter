# 👾 Nova Shooter
![GitHub release (with filter)](https://img.shields.io/github/v/release/ignViral/NovaShooter)
![GitHub License](https://img.shields.io/github/license/ignViral/NovaShooter)
![Recently Updated](https://img.shields.io/badge/Recently%20Updated-8A2BE2)

A simple, replayable game inspired by traditional alien shooters. The core gameplay loop consists of making it through multiple waves of aliens by shooting them without hitting any bullets or allowing any of them to reach the ground. A new boss is encountered every 5 waves, and you receive a checkpoint upon defeating every other boss. When you die, your score is converted into points that can be spent on "permanent" character upgrades that boost future playthroughs. Data saves, as the game operates on a server with a full sign-up & login system allowing for persistent storage of points, checkpoints, and data.

## ✨ Upgrades

The following "permanent" upgrades are available for varying amounts of points:

- Bullet Velocity (+0.3 bullet speed) [10 levels]
- Fire Rate (+0.03 firerate) [10 levels]
- Thruster (+0.2 speed) [6 levels]
- Firepower (+1 damage) [3 levels]
- Shield (+10 iframes) [4 levels]
- Extra Lives (+1 starting life) [2 levels]
- Center Cannon (+1 bullet) [1 levels]

## 💫 Prestige

Once you have purchased the highest level of all available standard upgrades, you unlock the ability to prestige. Prestiging costs **10,000 points**. This amount increases by 10,000 every time you prestige.
Prestiging will immediately reset your points and upgrades, but comes with a variety of benefits:
- You will be displayed on the Prestige Leaderboard
- You gain a permanent +10% point boost as well as a +10% speed boost
  - These increase by 5% for every prestige after the first
- You unlock ultimate abilities
  - Purchasable for challenge points in the Challenge shop, these are special powerful abilities unlocked at prestige 1, 3, and 5.
    - ✦ **Nova Blast:** Destroys all regular enemies on screen (does not work on bosses)
    - ✦ **Time Warp:** Slows all enemies by 75% for 8 seconds
    - ✦ **Orbital Strike:** Channels a massive beam that deals heavy damage to enemies in its path
  - Once purchased with challenge points, these all have separate hotkeys and can be used simultaneously. They each have a 60 second cooldown to recharge before each use.
  - Each ultimate ability has an associated upgrade in the Challenge Store that either increases their duration or shortens their cooldown.

The maximum prestige is **Prestige 10**. Prestiging also unlocks Challenge Runs!

## 💀 Challenge Runs

Once you reach Prestige 1, you unlock Challenge Runs. These are hardcore playthroughs with no checkpoints and zero reward if you die before defeating the final boss.

Before starting your run, you add Challenge Modifiers, each which have levels:
- Enemy Health (+1 health) [3 levels]
- Enemy Variety (+1 variant) [3 levels]
- Enemy Speed (+10% speed) [5 levels]
- Enemy Damage (+1 life/hit) [2 levels]

For each level of each modifier you add, should you conquer the challenge run, you will receive +1 Challenge Point. These can be spent on:
- Cosmetics
- Ultimate Abilities (& their upgrades)
- Permanent Regular Abilities

**☠️ All bosses are Enraged in Challenge Runs, granting them increased health, new abilities, and higher speeds!**

## 🔥 Admin Panel

By default, the account named "test" receives full admin permissions. This includes an admin panel on the bottom right of the game window allowing you to manipulate the user data of any account, including yourself. The admin account has permission to:

- Add points to any user
- Remove points from any user
- Reset the upgrades of any user
- Reset the account of any user

Admin permissions are permanent and cannot be reset. You can change the account to which they are given in the main server code.

## 📜 Miscellaneous

**🔐 Accounts:** When accounts are created, the PIN entered is hashed using SHA-256 before being stored. The raw pin is never saved to the disk. User data is stored in JSON format in a local file. Sessions use `express-session` with a random secret, stored in memory. The session cookie lasts 30 days, and if a session is active, the user will be able to skip the login page. It is important to note that the account system was designed only for persistent storage data with a small layer of security -- there are no kind of high-quality/production security measures being taken here to protect passwords. Only disposable PINs are advisable to use.

**🚩 Checkpoints:** You receive a checkpoint every 10 waves after defeating the current wave boss. Upon beating Wave 50, your checkpoint is reset to zero.

**💵 Upgrades:** Upgrades increase in price every level. They are reset upon prestige and their effects apply immediately (even while in-game).

**🛠️ Points:** Your score at the end of each round is converted into points at a 10:1 ratio, with the prestige bonus applied afterwards.

## 📘 Simple Installation Guide

To run & play the game, simply follow these steps:

1. Download and extract the zip file from the repository's latest release
2. Install all dependencies (viewable in `package.json`)
3. Start the server (i.e. `node server.js`)
4. Navigate your browser to `localhost:3000` and enjoy!

The port is customizable and is only set to 3000 as the default to avoid port overlaps.

## ❤️ Project Goals

The real goals of this project were to:

1. Just create a cool game that takes the core gameplay loop of an alien shooter and expands it
2. Experiment with using AI in game design and website coding as a whole to see the quality of the content it generates

The initial prototype for the game did not take a very long amount of time to create (apart from brainstorming) using Anthropic's Claude Opus 4.5 and 4.6 models.

## 🎉 The End
That's all for now! Thanks for reading, and enjoy the game!
