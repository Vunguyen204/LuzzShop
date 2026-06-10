import { Routes, Route } from "react-router-dom";
import { userRoutes } from "./routes";
import UserLayout from "./layouts/UserLayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserLayout />}>
        {userRoutes.map((route, index) => {
          const Page = route.component;

          return (
            <Route
              key={index}
              path={route.path === "/" ? "" : route.path.replace("/", "")}
              element={<Page />}
            />
          );
        })}
      </Route>
    </Routes>
  );
}

export default App;