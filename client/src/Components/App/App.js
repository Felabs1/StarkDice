import React from "react";
import GamePage from "../GamePage/GamePage";
import Join from "../Join/Join";
import Room from "../Room/Room";
import { Route, Switch } from "react-router-dom";
import io from "socket.io-client";

function App() {
  const ENDPOINT = "http://127.0.0.1:5000";
  let socket = io(ENDPOINT, { transports: ["websocket", "polling"] });
  return (
    <Switch>
      <Route path="/:id/game" render={() => <GamePage socket={socket} />} />
      <Route
        path="/"
        exact
        render={(routeProps) => <Join {...routeProps} socket={socket} />}
      />
      <Route
        path="/"
        render={(routeProps) => <Room {...routeProps} socket={socket} />}
      />
    </Switch>
  );
}

export default App;
