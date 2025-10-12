import { Header } from "../header";
import { StatusBar } from "../status-bar";
import { GameSection } from "../game-section";
import { LinksSection } from "../links-section";
import StarkNetLudoMenu from "../starknet-ludo-menu";
// import GameLobby from "../starknet-ludo-lobby"

export default function HomePage() {
  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
    //   <div className="container mx-auto px-4 py-8 max-w-6xl">
    //     <Header />
    //     <StatusBar />
    //     <GameSection />
    //     <LinksSection />
    //   </div>
    // </div>
    <>
      <StarkNetLudoMenu />
      {/* <GameLobby /> */}
    </>
  );
}
