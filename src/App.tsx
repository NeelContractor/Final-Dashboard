import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import Register from "./pages/AuthPages/Register";
// import UserProfiles from "./pages/Store/UserProfiles";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { SidebarProvider } from "./context/SidebarContext";

import AllProducts from "./pages/Products/AllProducts";
import AddProduct from "./pages/Products/AddProducts";
import Categories from "./pages/Products/Categories";
import Inventory from "./pages/Products/Inventory";
import LowStock from "./pages/Products/LowStock";

import AllOrders from "./pages/Orders/AllOrders";
import PendingOrders from "./pages/Orders/PendingOrders";
import ProcessingOrders from "./pages/Orders/ProcessingOrders";
import ShippedOrders from "./pages/Orders/ShippedOrders";
import DeliveredOrders from "./pages/Orders/DeliveredOrders";
import CancelledOrders from "./pages/Orders/CancelledOrders";
import ReturnedOrders from "./pages/Orders/ReturnedOrders";

import AllCustomers from "./pages/Customers/AllCustomers";
import CustomerReviews from "./pages/Customers/CustomerReviews";
import Messages from "./pages/Customers/Messages";

import SalesAnalytics from "./pages/Analytics/SalesAnalytics";
import TopProducts from "./pages/Analytics/TopProducts";
import RevenueReport from "./pages/Analytics/RevenueReport";

import Coupons from "./pages/Marketing/Coupons";
import Campaigns from "./pages/Marketing/Campaigns";
import Discount from "./pages/Marketing/Discount";
import EmailMarketing from "./pages/Marketing/EmailMarketing";

import StoreProfile from "./pages/Store/StoreProfile";
import UserProfiles from "./pages/Store/UserProfiles";
import Shipping from "./pages/Store/Shipping";
import Payments from "./pages/Store/Payments";

import AccountSettings from "./pages/Settings/AccountSettings";
import Notifications from "./pages/Settings/Notifications";
import Security from "./pages/Settings/Security";
import LogoutPage from "./pages/Settings/LogoutPage";
import CreateStore from "./pages/Store/CreateStore";

export default function App() {
  return (
    <SidebarProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />

            {/* Products */}
            <Route path="/products" element={<AllProducts />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/categories" element={<Categories />} />
            <Route path="/products/inventory" element={<Inventory />} />
            <Route path="/products/low-stock" element={<LowStock />} />

            {/* Orders */}
            <Route path="/orders" element={<AllOrders />} />
            <Route path="/orders/pending" element={<PendingOrders />} />
            <Route path="/orders/processing" element={<ProcessingOrders />} />
            <Route path="/orders/shipped" element={<ShippedOrders />} />
            <Route path="/orders/delivered" element={<DeliveredOrders />} />
            <Route path="/orders/cancelled" element={<CancelledOrders />} />
            <Route path="/orders/returned" element={<ReturnedOrders />} />

            {/* Customers */}
            <Route path="/customers" element={<AllCustomers />} />
            <Route path="/customers/review" element={<CustomerReviews />} />
            <Route path="/customers/messages" element={<Messages />} />

            {/* Analytics */}
            <Route path="/analytics/sales-analytics" element={<SalesAnalytics />} />
            <Route path="/analytics/top-products" element={<TopProducts />} />
            <Route path="/analytics/revenue" element={<RevenueReport />} />

            {/* Marketing */}
            <Route path="/marketing/coupons" element={<Coupons />} />
            <Route path="/marketing/campaigns" element={<Campaigns />} />
            <Route path="/marketing/discounts" element={<Discount />} />
            <Route path="/marketing/email" element={<EmailMarketing />} />

            {/* Store */}
            <Route path="/store/create-store" element={<CreateStore />} />
            <Route path="/store/store-profile" element={<StoreProfile />} />
            <Route path="/store/shipping" element={<Shipping />} />
            <Route path="/store/payments" element={<Payments />} />
            <Route path="/store/user-profile" element={<UserProfiles />} />

            {/* Settings */}
            <Route path="/settings/account" element={<AccountSettings />} />
            <Route path="/settings/notifications" element={<Notifications />} />
            <Route path="/settings/security" element={<Security />} />
            <Route path="/settings/logout" element={<LogoutPage />} />
          </Route>

          {/* Auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}
