import { Routes, Route } from "react-router-dom";
import { userRoutes } from "./routes";

function App() {
  return (
    <Routes>
      {userRoutes.map((route, index) => {
        const Page = route.component;

        return (
          <Route
            key={index}
            path={route.path}
            element={<Page />}
          />
        );
      })}
    </Routes>
  );
}

export default App;