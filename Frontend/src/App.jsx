import { Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";
import { userRoutes, adminRoutes } from "./routes";

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserLayout />}>
        {userRoutes.map((route, index) => {
          const Page = route.component;

          return (
            <Route
              key={index}
              path={route.path === "/" ? "" : route.path.substring(1)}
              element={<Page />}
            />
          );
        })}
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        {adminRoutes.map((route, index) => {
          const Page = route.component;

          return <Route key={index} path={route.path} element={<Page />} />;
        })}
      </Route>
    </Routes>
  );
}

export default App;
