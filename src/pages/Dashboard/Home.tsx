// src/pages/Dashboard/Home.tsx

import React from "react";
import WelcomeCard from "../../components/ecommerce/WelcomeCard";
import StatCards from "../../components/ecommerce/StatCards";
import ProfitExpensesChart from "../../components/ecommerce/ProfitExpensesChart";
import ProductSalesChart from "../../components/ecommerce/ProductSalesChart";
import NewGoalsCard from "../../components/ecommerce/NewGoalsCard";
import LowStockAlerts from "../../components/ecommerce/LowStockAlerts";
import RecentOrdersCard from "../../components/ecommerce/RecentOrdersCard";
import TopProductsTable from "../../components/ecommerce/TopProductsTable";
import { useAuth } from "../../hooks/useAuth";

const Home: React.FC = () => {
  const { isVerifying } = useAuth();

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className="xl:col-span-2"><WelcomeCard /></div>
        <div className="xl:col-span-1"><StatCards /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><ProfitExpensesChart /></div>
        <div className="lg:col-span-1"><ProductSalesChart /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1"><NewGoalsCard /></div>
        <div className="lg:col-span-1"><LowStockAlerts /></div>
        <div className="lg:col-span-1"><RecentOrdersCard /></div>
      </div>
      <TopProductsTable />
    </div>
  );
};

export default Home;