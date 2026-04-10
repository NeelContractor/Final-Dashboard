// src/pages/Dashboard/Home.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import WelcomeCard from "../../components/ecommerce/WelcomeCard";
import StatCards from "../../components/ecommerce/StatCards";
import ProfitExpensesChart from "../../components/ecommerce/ProfitExpensesChart";
import ProductSalesChart from "../../components/ecommerce/ProductSalesChart";
import NewGoalsCard from "../../components/ecommerce/NewGoalsCard";
import LowStockAlerts from "../../components/ecommerce/LowStockAlerts";
import RecentOrdersCard from "../../components/ecommerce/RecentOrdersCard";
import TopProductsTable from "../../components/ecommerce/TopProductsTable";
import { userDetails } from "../../services/userService";
import { tokenStorage } from "../../utils/tokenStorage";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyUserAndStore = async () => {
      const token = tokenStorage.get();

      // Step 1: No token → go to signin
      if (!token) {
        navigate("/signin");
        return;
      }

      try {
        const response = await userDetails();

        // Step 2: Response is { status, data: { stores: [] } }
        const stores = response?.data?.stores;

        // Step 3: stores is empty array → redirect to create store
        if (!stores || stores.length === 0) {
          navigate("/store/create-store");
          return;
        }

        // Step 4: stores exist → allow dashboard to render
        setIsVerifying(false);

      } catch (err: any) {
        // Only clear token if it's actually unauthorized
        if (err?.status === 401 || err?.message?.toLowerCase().includes("unauthorized")) {
          tokenStorage.remove();
          navigate("/signin");
        } else {
          // Network/server error — don't wipe token, just show dashboard
          setIsVerifying(false);
        }
      }
    };

    verifyUserAndStore();
  }, [navigate]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Welcome + Stat Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className="xl:col-span-2">
          <WelcomeCard />
        </div>
        <div className="xl:col-span-1">
          <StatCards />
        </div>
      </div>

      {/* Row 2: P&L Chart + Units Sold / Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ProfitExpensesChart />
        </div>
        <div className="lg:col-span-1">
          <ProductSalesChart />
        </div>
      </div>

      {/* Row 3: Monthly Goals + Low Stock + Order History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <NewGoalsCard />
        </div>
        <div className="lg:col-span-1">
          <LowStockAlerts />
        </div>
        <div className="lg:col-span-1">
          <RecentOrdersCard />
        </div>
      </div>

      {/* Row 4: Top Selling Products Table (full width) */}
      <TopProductsTable />
    </div>
  );
};

export default Home;