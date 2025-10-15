# 🎲 StarkDice

![StarkDice Screenshot](https://github.com/user-attachments/assets/a32e318d-f91b-46ac-98dc-eb946e5f0318)

**StarkDice** is a **multiplayer Ludo game built entirely on Starknet** using the [Dojo engine](https://book.dojoengine.org/).  
It demonstrates how on-chain gaming can merge **provably fair randomness**, **real-time multiplayer interaction**, and **decentralized game logic** — all running trustlessly on Starknet.

---

## 🚀 Overview

Unlike traditional Web2 games that rely on centralized servers and hidden algorithms, **StarkDice** brings *transparency* to every move.  
Every dice roll, game state update, and player interaction is verified on-chain, ensuring that no one — not even the game creator — can tamper with results.

---

## 🧠 Tech Stack

- 🦀 **Cairo v2 + Dojo Engine** — game logic and entity-component-system architecture  
- 🌐 **Starknet.js** — on-chain interaction from the client  
- 🧩 **Torii Indexer** — real-time off-chain event sync  
- ⚛️ **React + Vite** — fast and responsive frontend  
- 🎮 **BabylonJS** — immersive 3D visuals and dice animations

---

## 🕹️ Features

- 🎲 **Provably fair dice rolls** — randomness verified on-chain  
- 👫 **Multiplayer gameplay** — challenge friends or global players  
- 🏆 **Real-time interaction** — live state updates via Torii  
- 🔗 **Dojo modular contracts** — scalable, composable systems  
- ⚡ **Low fees & high speed** — powered by Starknet L2 performance  

---

## 🧩 Repository Structure

| Directory | Description |
|------------|--------------|
| `starkdice_contracts` | Dojo smart contracts handling the game logic |
| `client` | React frontend that connects to Starknet via Torii |

---

## ⚙️ Setup Instructions

### 1. Install Cairo
Follow the [official Cairo installation guide](https://www.starknet.io/cairo-book/ch01-01-installation.html).

### 2. Install Dojo
Use the [Dojo Installation Guide](https://dojoengine.org/installation).

### 3. Install Node.js
Download from the [Node.js official site](https://nodejs.org/en/download).

### 4. Clone the Repository
```bash
git clone https://github.com/Felabs1/StarkDice.git
cd StarkDice
```
#### 🧭 Client Setup
```cd client
npm install --force
npm run dev
```
#### 🛠️ Dojo Setup
```
cd starkdice_contracts
```
```
katana --config katana.toml
```
```
sozo build && sozo migrate
```
```
torii --config torii_dev.toml
```
## 🧮 How to Play
1. Connect your Starknet wallet.
2. Join or create a game room.
3. Roll the dice — your result is stored and verified on-chain.
4. Move your Ludo pieces strategically to win.
5. Watch the real-time state sync update for all connected players.

## 🧰 Code Highlight — Provably Fair Dice Roll
```rust
fn roll_dice(player: ContractAddress) -> u8 {
    // pseudo-randomness using block hash & player address
    let seed = get_block_hash() ^ player.into();
    (seed % 6) + 1
}
```

Each roll depends on verifiable on-chain data, making it impossible to manipulate outcomes.

##  Impact
StarkDice demonstrates how on-chain verifiable randomness can redefine fairness in multiplayer games.
This transparent gaming model can extend to:
1. Board games
2. Betting systems
3. Skill-based tournaments

It’s a small step toward a trustless, transparent, and fun Web3 gaming ecosystem.

## 🧩 Progress During Hackathon
- ✅ Implemented on-chain dice logic with Dojo ECS
- ✅ Deployed contracts to Starknet Sepolia Testnet
- ✅ Integrated Torii for real-time multiplayer updates
- ✅ Built and styled client with BabylonJS
- 🚧 Currently refining animations and UX polish


## 🔮 Future Enhancements
- 💬 In-game chat and reactions
- 🪙 Player reward tokens and leaderboard
- 🧠 AI-assisted auto-play for single-player mode
## 🎥 Demo & Screenshots
- 🎬 Watch Demo
### 🖼️ Gameplay Screenshots
#### Dice roll interface
#### Game board view
#### Multiplayer lobby

## 🏁 Judging Criteria Alignment

| **Criteria** | **How StarkDice Meets It** |
|---------------|-----------------------------|
| **Technical Execution** | Fully functional Cairo-based on-chain logic, Torii integration, and live UI |
| **Innovation & Creativity** | First Dojo-based Ludo game leveraging verifiable randomness |
| **Impact & Usefulness** | Showcases the real potential of trustless gaming on Starknet |
| **Presentation & Clarity** | Clear documentation, visuals, and video demo |
| **Progress During Hackathon** | Significant progress: contracts, indexer, and front-end integration achieved |

## 🧑‍💻 Authors
Built by Felix Awere and the Twiga Devs
A team of Web3 builders from Kisumu passionate about on-chain games and decentralized systems.
Built with ❤️ using Dojo on Starknet
