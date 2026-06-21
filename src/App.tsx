import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import NewCustomer from "@/pages/NewCustomer";
import Templates from "@/pages/Templates";
import Exceptions from "@/pages/Exceptions";
import Statistics from "@/pages/Statistics";
import Staff from "@/pages/Staff";
import Handover from "@/pages/Handover";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<NewCustomer />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/handover" element={<Handover />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/staff" element={<Staff />} />
        </Route>
      </Routes>
    </Router>
  );
}
