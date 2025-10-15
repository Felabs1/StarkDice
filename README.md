# StarkDice 🎲

StarkDice is a **multiplayer Ludo game built on Starknet** using the [Dojo engine](https://book.dojoengine.org/).  
The goal is to showcase the power of on-chain gaming by combining **provably fair dice rolls**, **multiplayer interaction**, and **decentralized logic**.

---

## Features

- 🎲 **Provably fair dice rolls** secured on-chain
- 👫 **Multiplayer support** for friends and global players
- 🏆 **Real-time gameplay** with turn-based mechanics
- 🔗 **Built with Dojo** for scalable, modular smart contracts
- 🌐 **Starknet-powered** for low fees and fast execution

---

## Repository Structure

- `starkdice_contracts`: Dojo contracts deployed on Starknet, handling the game logic
- `client`: The client app that interacts with the contracts (with Torii indexing support)

## Setup Environment

### install cairo

you can install cairo using the guidelines below

[cairo installation guidelines](https://www.starknet.io/cairo-book/ch01-01-installation.html)

### install Dojo

Install the Dojo toolchain, you can check out the installation instructions here

[Dojo Installation Guidelines](https://dojoengine.org/installation)

### install nodejs

For Nodejs installation instructions, use this guideline below

[Nodejs installation guideline ](https://nodejs.org/en/download)

### Clone the Repository

```
git clone https://github.com/Felabs1/StarkDice.git
```

```
cd StarkDice
```

#### Client setup

```
cd client
```

```
npm install --force
```

```
npm run dev
```

#### Dojo setup

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
