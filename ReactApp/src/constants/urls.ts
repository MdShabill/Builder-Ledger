//Path: src/constants/urls.ts

//Loalhost environment variable for API base URL
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7142/api"
).replace(/\/$/, "");


// Production environment variable for API base URL

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");

// if (!API_BASE_URL) {
//   throw new Error("VITE_API_BASE_URL is not configured.");
// }

// Keep your existing API_URLS and APP_ROUTES below this line.

// Backend API URLs
export const API_URLS = {
  account: {
    login: `${API_BASE_URL}/Account/login`,
  },

  site: {
    base: `${API_BASE_URL}/Site`,
    add: `${API_BASE_URL}/Site/add`,
    update: `${API_BASE_URL}/Site/update`,
    delete: (id: number) => `${API_BASE_URL}/Site/${id}`,
    all: `${API_BASE_URL}/Site/GetAllSites`,
    select: (id: number) => `${API_BASE_URL}/Site/select-site?id=${id}`,
    edit: (id: number) => `${API_BASE_URL}/Site/edit/${id}`,
    dropdown: `${API_BASE_URL}/Site/dropdown-data`,
    providers: `${API_BASE_URL}/Site/service-providers`,
    filter: `${API_BASE_URL}/Site/filter`,
    scopeStatus: `${API_BASE_URL}/Site/scope-status`,
  },

  
  costMaster: {
  base: `${API_BASE_URL}/CostMaster`,
  index: `${API_BASE_URL}/CostMaster/Index`,
  activeCost: `${API_BASE_URL}/CostMaster/GetActiveCost`,
  byId: (id: number) => `${API_BASE_URL}/CostMaster/${id}`,
  },


  attendance: {
    base: `${API_BASE_URL}/DailyAttendance`,
    dropdown: `${API_BASE_URL}/DailyAttendance/dropdown-data`,
    costByServiceType: `${API_BASE_URL}/DailyAttendance/GetCostByServiceType`,
  },

  dashboard: {
    stats: `${API_BASE_URL}/Dashboard/stats`,
    scopeItems: `${API_BASE_URL}/Dashboard/scope-items`,
    monthlyActivity: `${API_BASE_URL}/Dashboard/monthly-activity`,
  },

  materialPurchase: {
    base: `${API_BASE_URL}/MaterialPurchase`,
    dropdown: `${API_BASE_URL}/MaterialPurchase/dropdown-data`,
    materialInfo: `${API_BASE_URL}/MaterialPurchase/material-info`,
  },

  serviceProvider: {
    base: `${API_BASE_URL}/ServiceProvider`,
    dropdown: `${API_BASE_URL}/ServiceProvider/dropdown-data`,
  },
};

// Frontend page routes
export const APP_ROUTES = {
  root: "/",
  login: "/login",
  home: "/home",
  sites: "/sites",
  siteDetail: "/site-detail/:id",
  siteAdd: "/site-add",
  siteEdit: "/site-edit/:id",
  noSiteSelected: "/no-site-selected",
  costMaster: "/cost-master",
  costMasterAdd: "/cost-master/add",
  costMasterEdit: "/cost-master/edit/:id",
  attendance: "/attendance",
  attendanceAdd: "/attendance/add",
  material: "/material",
  materialAdd: "/material/add",
  serviceProvider: "/service-provider",
  serviceProviderAdd: "/service-provider/add",
  serviceProviderEdit: "/service-provider/edit/:id",
};

export const APP_PATHS = {
  siteDetail: (id: number) => `/site-detail/${id}`,
  siteEdit: (id: number) => `/site-edit/${id}`,
  costMasterEdit: (id: number) => `/cost-master/edit/${id}`,
  serviceProviderEdit: (id: number) => `/service-provider/edit/${id}`,
};
