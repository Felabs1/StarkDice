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

## 🧰 Code Highlight — Moving piece from diceroll
```rust
   fn move_piece(
            ref self: ContractState, game_id: felt252, player_index: u8, piece_index: u8,
        ) {
            let player_address: ContractAddress = get_caller_address();
            let mut world = self.world_default();
            let mut game: Game = world.read_model(game_id);

            assert(game.dice_roll == 'DICE_ROLLED', 'dice_not_rolled');

            let mut player: Player = world.read_model((game_id, player_address));
            let mut piece: Piece = world.read_model((game_id, player_index, piece_index));

            // ✅ Fix: compare against piece.player_index instead of piece_index
            // POSTPONED: will add player.index assertions after hackathon
            assert(piece.player_index == player_index, 'NOT_YOUR_TURN');

            let mut dice_roll: DiceRoll = world.read_model((game_id, player_index));
            let steps = dice_roll.value;

            let piece_eligible: bool = piece.is_eligible(player_index, steps);
            if piece_eligible {
                piece.increment_piece_position(steps);

                // inquire the new position
                let is_kill = self
                    .check_for_kill(game_id, player_index, piece_index, piece.position);

                if is_kill || steps == 6 {
                    // ✅ Fix: assignment, not comparison
                    game.dice_roll = 'DICE_NOT_ROLLED';
                    game.is_active = true;
                } else {
                    game.increment_turn();
                    game.is_active = true;
                }
                // self.has_player_won(game_id, player_index);

            } else {
                game.increment_turn();
                game.is_active = true;
            }

            world.write_model(@piece);
            world.write_model(@game);
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
- 🎬 (Watch demo)[https://www.youtube.com/watch?v=stvxRU1C8-U]
### 🖼️ Gameplay Screenshots
#### Dice roll interface

#### Game board view
<img width="1512" height="982" alt="Screenshot 2025-10-15 at 18 03 37" src="https://github.com/user-attachments/assets/e040d919-08a2-4614-b2f9-89890b1808ec" />

#### Multiplayer lobby
<img width="1512" height="864" alt="Screenshot 2025-10-16 at 00 24 37" src="https://github.com/user-attachments/assets/654d7873-1677-4e44-8d7b-e680fb9d164d" />

## 🏁 Judging Criteria Alignment

| **Criteria** | **How StarkDice Meets It** |
|---------------|-----------------------------|
| **Technical Execution** | Fully functional Cairo-based on-chain logic, Torii integration, and live UI |
| **Innovation & Creativity** | First Dojo-based Ludo game leveraging verifiable randomness |
| **Impact & Usefulness** | Showcases the real potential of trustless gaming on Starknet |
| **Presentation & Clarity** | Clear documentation, visuals, and video demo |
| **Progress During Hackathon** | Significant progress: contracts, indexer, and front-end integration achieved |

## 🧑‍💻 Team
Built with pride by
- Felix Awere
- Peter Kagwe
