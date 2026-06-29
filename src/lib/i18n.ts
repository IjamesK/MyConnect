export type AppLanguage = "en" | "sw" | "lg" | "fr";

export const languageLabels: Record<AppLanguage, string> = {
  en: "English",
  sw: "Kiswahili",
  lg: "Luganda",
  fr: "French",
};

export const translations = {
  en: {
    settings: "Settings",
    appSettings: "App Settings",
    chooseLanguage: "Choose language",
    theme: "Theme",
    home: "Home",
    status: "Status",
    support: "Support",
    account: "Account",
    notifications: "Notifications",
    logout: "Logout",
    dashboard: "Dashboard",
    networkStatus: "Network Status",
    troubleshoot: "Troubleshoot",
    reportIssue: "Report Issue",
    openTicket: "Open Support Ticket",
    serviceOperational: "Service operational",
    activeIncident: "Active incident",
    plannedMaintenance: "Planned maintenance",
    slowInternet: "Slow Internet",
    noInternet: "No Internet",
    wifiProblems: "Wi-Fi Problems",
    changeWifiPassword: "Change Wi-Fi Password",
  },

  sw: {
    settings: "Mipangilio",
    appSettings: "Mipangilio ya App",
    chooseLanguage: "Chagua lugha",
    theme: "Muonekano",
    home: "Nyumbani",
    status: "Hali",
    support: "Msaada",
    account: "Akaunti",
    notifications: "Taarifa",
    logout: "Toka",
    dashboard: "Dashibodi",
    networkStatus: "Hali ya Mtandao",
    troubleshoot: "Tambua Tatizo",
    reportIssue: "Ripoti Tatizo",
    openTicket: "Fungua Ombi la Msaada",
    serviceOperational: "Huduma inafanya kazi",
    activeIncident: "Tatizo linaendelea",
    plannedMaintenance: "Matengenezo yaliyopangwa",
    slowInternet: "Intaneti Polepole",
    noInternet: "Hakuna Intaneti",
    wifiProblems: "Matatizo ya Wi-Fi",
    changeWifiPassword: "Badilisha Nenosiri la Wi-Fi",
  },

  lg: {
    settings: "Enteekateeka",
    appSettings: "Enteekateeka za App",
    chooseLanguage: "Londa olulimi",
    theme: "Endabika",
    home: "Awaka",
    status: "Embeera",
    support: "Obuyambi",
    account: "Akaunti",
    notifications: "Obubaka",
    logout: "Fuluma",
    dashboard: "Dashboard",
    networkStatus: "Embeera ya Network",
    troubleshoot: "Kebera Ekizibu",
    reportIssue: "Loopa Ekizibu",
    openTicket: "Ggulawo Tikiti y'Obuyambi",
    serviceOperational: "Service ekola bulungi",
    activeIncident: "Waliwo ekizibu",
    plannedMaintenance: "Okulongoosa okutegekeddwa",
    slowInternet: "Internet egenda mpola",
    noInternet: "Tewali Internet",
    wifiProblems: "Ebizibu bya Wi-Fi",
    changeWifiPassword: "Kyusa Password ya Wi-Fi",
  },

  fr: {
    settings: "Paramètres",
    appSettings: "Paramètres de l'application",
    chooseLanguage: "Choisir la langue",
    theme: "Thème",
    home: "Accueil",
    status: "Statut",
    support: "Support",
    account: "Compte",
    notifications: "Notifications",
    logout: "Déconnexion",
    dashboard: "Tableau de bord",
    networkStatus: "État du réseau",
    troubleshoot: "Diagnostic",
    reportIssue: "Signaler un problème",
    openTicket: "Ouvrir un ticket",
    serviceOperational: "Service opérationnel",
    activeIncident: "Incident actif",
    plannedMaintenance: "Maintenance planifiée",
    slowInternet: "Internet lent",
    noInternet: "Pas d'Internet",
    wifiProblems: "Problèmes Wi-Fi",
    changeWifiPassword: "Changer le mot de passe Wi-Fi",
  },
} as const;

function isLanguage(value: string | null): value is AppLanguage {
  return value === "en" || value === "sw" || value === "lg" || value === "fr";
}

export function getSavedLanguage(): AppLanguage {
  try {
    if (typeof window === "undefined") return "en";

    const saved = window.localStorage.getItem("appLanguage");

    if (isLanguage(saved)) return saved;
  } catch (error) {
    console.warn("Failed to read saved language:", error);
  }

  return "en";
}

export function saveLanguage(language: AppLanguage) {
  try {
    if (typeof window === "undefined") return;

    window.localStorage.setItem("appLanguage", language);
    window.dispatchEvent(new Event("languagechange"));
  } catch (error) {
    console.warn("Failed to save language:", error);
  }
}
