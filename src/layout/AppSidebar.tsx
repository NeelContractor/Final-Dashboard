import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

type SubItem = {
  name: string;
  path: string;
};

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

const OrdersIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 7H20L18.5 16H9.5L8 7Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 7L7.3 4.8C7.12 4.27 6.62 3.9 6.06 3.9H4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="10" cy="19" r="1.4" fill="currentColor" />
    <circle cx="17" cy="19" r="1.4" fill="currentColor" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 19V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 19V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 19V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MarketingIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 12.5V10.5C4 9.95 4.45 9.5 5 9.5H7.5L15.7 6.2C16.36 5.93 17.08 6.42 17.08 7.13V15.87C17.08 16.58 16.36 17.07 15.7 16.8L7.5 13.5H5C4.45 13.5 4 13.05 4 12.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 8.5C19.43 9.22 20 10.34 20 11.5C20 12.66 19.43 13.78 18.5 14.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M7 13.5L8.2 18.1"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const StoreIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 10L6.2 5.8C6.39 5.12 7.01 4.65 7.72 4.65H16.28C16.99 4.65 17.61 5.12 17.8 5.8L19 10"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 10H18V17.5C18 18.33 17.33 19 16.5 19H7.5C6.67 19 6 18.33 6 17.5V10Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M9 14H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    className="h-6 w-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 8.7C10.18 8.7 8.7 10.18 8.7 12C8.7 13.82 10.18 15.3 12 15.3C13.82 15.3 15.3 13.82 15.3 12C15.3 10.18 13.82 8.7 12 8.7Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M19.4 13.05V10.95L17.58 10.44C17.43 9.94 17.23 9.47 16.96 9.03L17.89 7.38L16.42 5.91L14.77 6.84C14.33 6.57 13.86 6.37 13.36 6.22L12.85 4.4H10.75L10.24 6.22C9.74 6.37 9.27 6.57 8.83 6.84L7.18 5.91L5.71 7.38L6.64 9.03C6.37 9.47 6.17 9.94 6.02 10.44L4.2 10.95V13.05L6.02 13.56C6.17 14.06 6.37 14.53 6.64 14.97L5.71 16.62L7.18 18.09L8.83 17.16C9.27 17.43 9.74 17.63 10.24 17.78L10.75 19.6H12.85L13.36 17.78C13.86 17.63 14.33 17.43 14.77 17.16L16.42 18.09L17.89 16.62L16.96 14.97C17.23 14.53 17.43 14.06 17.58 13.56L19.4 13.05Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const menuItems: MenuItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/",
  },
  {
    name: "Products",
    icon: <BoxCubeIcon />,
    subItems: [
      { name: "All Products", path: "/products" },
      { name: "Add Product", path: "/products/add" },
      { name: "Categories", path: "/products/categories" },
      { name: "Inventory", path: "/products/inventory" },
      { name: "Low Stock", path: "/products/low-stock" },
    ],
  },
  {
    name: "Orders",
    icon: <OrdersIcon />,
    subItems: [
      { name: "All Orders", path: "/orders" },
      { name: "Pending Orders", path: "/orders/pending" },
      { name: "Processing Orders", path: "/orders/processing" },
      { name: "Shipped Orders", path: "/orders/shipped" },
      { name: "Delivered Orders", path: "/orders/delivered" },
      { name: "Cancelled Orders", path: "/orders/cancelled" },
      { name: "Returned Orders", path: "/orders/returned" },
    ],
  },
  {
    name: "Customers",
    icon: <UserCircleIcon />,
    subItems: [
      { name: "All Customers", path: "/customers" },
      { name: "Customer Review", path: "/customers/review" },
      { name: "Messages", path: "/customers/messages" },
    ],
  },
  {
    name: "Analytics",
    icon: <AnalyticsIcon />,
    subItems: [
      { name: "Sales Analytics", path: "/analytics/sales-analytics" },
      { name: "Top Products", path: "/analytics/top-products" },
      { name: "Revenue Report", path: "/analytics/revenue" },
    ],
  },
  {
    name: "Marketing",
    icon: <MarketingIcon />,
    subItems: [
      { name: "Coupons", path: "/marketing/coupons" },
      { name: "Campaigns", path: "/marketing/campaigns" },
      { name: "Discount", path: "/marketing/discounts" },
      { name: "Email Marketing", path: "/marketing/email" },
    ],
  },
  {
    name: "Store",
    icon: <StoreIcon />,
    subItems: [
      { name: "Create Store",  path: "/store/create-store" },
      { name: "User Profile", path: "/store/user-profile" },
      { name: "Store Profile", path: "/store/store-profile" },
      { name: "Shipping", path: "/store/shipping" },
      { name: "Payments", path: "/store/payments" },
    ],
  },
  {
    name: "Settings",
    icon: <SettingsIcon />,
    subItems: [
      { name: "Account Settings", path: "/settings/account" },
      { name: "Notifications", path: "/settings/notifications" },
      { name: "Security", path: "/settings/security" },
      { name: "Logout", path: "/settings/logout" },
    ],
  },
];

const dashboardItem = menuItems.find((item) => item.name === "Dashboard");
const otherMenuItems = menuItems.filter((item) => item.name !== "Dashboard");

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();

  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const isSidebarOpen = isExpanded || isHovered || isMobileOpen;
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.subItems?.some((sub) => isActive(sub.path))
    );

    if (activeParent) {
      setOpenMenu(activeParent.name);
    }
  }, [location.pathname]);

  const renderMenuItem = (item: MenuItem) => (
    <li key={item.name}>
      {item.subItems ? (
        <>
          <button
            onClick={() => setOpenMenu(openMenu === item.name ? null : item.name)}
            className={`menu-item group w-full cursor-pointer ${
              openMenu === item.name ? "menu-item-active" : "menu-item-inactive"
            } ${!isSidebarOpen ? "lg:justify-center" : "lg:justify-start"}`}
          >
            <span
              className={`menu-item-icon-size ${
                openMenu === item.name
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
            >
              {item.icon}
            </span>

            {isSidebarOpen && (
              <>
                <span className="menu-item-text">{item.name}</span>
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                    openMenu === item.name ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              </>
            )}
          </button>

          {isSidebarOpen && openMenu === item.name && (
            <ul className="ml-9 mt-2 space-y-1">
              {item.subItems.map((subItem) => (
                <li key={subItem.name}>
                  <Link
                    to={subItem.path}
                    onClick={closeMobileSidebar}
                    className={`menu-dropdown-item flex items-center gap-3 ${
                      isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isActive(subItem.path) ? "bg-brand-500" : "bg-gray-300"
                      }`}
                    />
                    <span>{subItem.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        item.path && (
          <Link
            to={item.path}
            onClick={closeMobileSidebar}
            className={`menu-item group ${
              isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
            } ${!isSidebarOpen ? "lg:justify-center" : "lg:justify-start"}`}
          >
            <span
              className={`menu-item-icon-size ${
                isActive(item.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
            >
              {item.icon}
            </span>

            {isSidebarOpen && <span className="menu-item-text">{item.name}</span>}
          </Link>
        )
      )}
    </li>
  );

  return (
    <aside
className={`fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:top-0 lg:h-screen        ${isSidebarOpen ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !isSidebarOpen ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" onClick={closeMobileSidebar} className="flex items-center gap-3">
          <img src="/images/logo/Storly-Trasn.png" alt="Logo" width={32} height={32} className="rounded-xl" />
          {isSidebarOpen && (
            <span className="text-2xl font-semibold text-slate-900">
              Seller Hub
            </span>
          )}
        </Link>
      </div>

<div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain pb-10">
        <nav className="mb-6">
          {dashboardItem && (
            <div className="mb-6">
              <h2
                className={`mb-3 flex text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 ${
                  !isSidebarOpen ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isSidebarOpen ? "Home" : <HorizontaLDots className="size-5" />}
              </h2>

              <ul className="flex flex-col gap-2">{renderMenuItem(dashboardItem)}</ul>
            </div>
          )}

          <div>
            <h2
              className={`mb-3 flex text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 ${
                !isSidebarOpen ? "lg:justify-center" : "justify-start"
              }`}
            >
              {isSidebarOpen ? "Menu" : <HorizontaLDots className="size-5" />}
            </h2>

            <ul className="flex flex-col gap-2">
              {otherMenuItems.map((item) => renderMenuItem(item))}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
