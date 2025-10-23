import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { jwt } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (jwt) {
      const socketInstance = io("/ludo", {
        auth: { token: jwt },
      });
      setSocket(socketInstance);

      socketInstance.on("connect", () => console.log("Connected to /ludo"));
      socketInstance.on("disconnect", () => console.log("Disconnected"));
      return () => socketInstance.disconnect();
    }
  }, [jwt]);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};
