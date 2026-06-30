export type RouterType = "zte_white" | "alc_black" | "alcl_black" | "unknown";

export type RouterLightColor = "green" | "red";

export type RouterLight = {
  id: string;
  label: string;
  description: string;
  color: RouterLightColor;
};

export type RouterLightCheck = {
  routerType: RouterType;
  routerName: string;
  pattern: string;
  selectedLights: string[];
  checkedAt: string;
};

export function normalizeRouterType(value?: string | null): RouterType {
  if (value === "zte_white") return "zte_white";
  if (value === "alc_black" || value === "alcl_black") return value;
  return "zte_white";
}

export function routerName(routerType: RouterType) {
  if (routerType === "alc_black" || routerType === "alcl_black") {
    return "Black ALCL ONT";
  }

  if (routerType === "unknown") return "Router / ONT";

  return "White ZTE Router";
}

export function routerLightsFor(routerType: RouterType): RouterLight[] {
  if (routerType === "alc_black" || routerType === "alcl_black") {
    return [
      {
        id: "power",
        label: "POWER",
        description: "Device power status",
        color: "green",
      },
      {
        id: "auth",
        label: "AUTH",
        description: "Router authorization status",
        color: "green",
      },
      {
        id: "link",
        label: "LINK",
        description: "Fiber link status",
        color: "green",
      },
      {
        id: "wlan24",
        label: "WLAN 2.4G",
        description: "2.4GHz Wi-Fi network is active",
        color: "green",
      },
      {
        id: "wlan5",
        label: "WLAN 5G",
        description: "5GHz Wi-Fi network is active",
        color: "green",
      },
      {
        id: "internet",
        label: "INTERNET",
        description: "Internet connection status",
        color: "green",
      },
      {
        id: "lan1",
        label: "LAN1",
        description: "Wired device connected",
        color: "green",
      },
      {
        id: "lan2",
        label: "LAN2",
        description: "Wired device connected",
        color: "green",
      },
      {
        id: "lan3",
        label: "LAN3",
        description: "Wired device connected",
        color: "green",
      },
      {
        id: "lan4",
        label: "LAN4",
        description: "Wired device connected",
        color: "green",
      },
    ];
  }

  return [
    {
      id: "power",
      label: "POWER",
      description: "Device power status",
      color: "green",
    },
    {
      id: "pon",
      label: "PON",
      description: "Fiber signal from the ISP",
      color: "green",
    },
    {
      id: "los",
      label: "LOS",
      description: "Loss of Signal. Red means the fiber signal may be down",
      color: "red",
    },
    {
      id: "internet",
      label: "INTERNET",
      description: "Internet connection status",
      color: "green",
    },
    {
      id: "wifi",
      label: "WiFi",
      description: "Wireless network is active",
      color: "green",
    },
    {
      id: "lan1",
      label: "LAN1",
      description: "Wired device connected",
      color: "green",
    },
    {
      id: "lan2",
      label: "LAN2",
      description: "Second wired device connection",
      color: "green",
    },
  ];
}

export function diagnoseRouterLights(
  routerType: RouterType,
  selectedIds: string[],
  fallbackIssue = "no_internet"
) {
  const has = (id: string) => selectedIds.includes(id);

  if (routerType === "alc_black" || routerType === "alcl_black") {
    const sixMainLightsOn =
      has("power") &&
      has("auth") &&
      has("link") &&
      has("wlan24") &&
      has("wlan5") &&
      has("internet");

    const onlyPowerAndWifi =
      has("power") &&
      has("wlan24") &&
      has("wlan5") &&
      !has("auth") &&
      !has("link") &&
      !has("internet");

    if (!has("power")) return "alc_no_power";
    if (onlyPowerAndWifi) return "alc_internet_down";
    if (has("power") && !has("auth")) return "alc_auth_issue";
    if (has("power") && !has("link")) return "alc_link_issue";
    if (has("power") && !has("internet")) return "alc_internet_down";
    if (!has("wlan24") && !has("wlan5")) return "alc_wifi_disabled";
    if (sixMainLightsOn) return "alc_normal_lights";

    return "alc_unclear";
  }

  if (!has("power")) return "zte_no_power";
  if (has("los")) return "zte_los_red";
  if (has("power") && has("pon") && !has("internet")) {
    return "zte_internet_off_noc";
  }
  if (has("power") && has("pon") && has("internet") && !has("wifi")) {
    return "zte_wifi_disabled";
  }
  if (has("power") && has("pon") && has("internet") && has("wifi")) {
    return "zte_normal_lights";
  }
  if (has("power") && !has("pon")) return "zte_fiber_unclear";

  return fallbackIssue || "zte_unclear";
}

export function ticketTypeFromRouterPattern(issue: string, pattern: string) {
  if (pattern === "zte_los_red") return "los_light";
  if (pattern === "zte_internet_off_noc") return "no_internet";
  if (pattern === "zte_wifi_disabled") return "router_issue";
  if (pattern === "zte_no_power") return "router_issue";

  if (pattern === "alc_no_power") return "router_issue";
  if (pattern === "alc_wifi_disabled") return "router_issue";
  if (pattern === "alc_auth_issue") return "no_internet";
  if (pattern === "alc_link_issue") return "no_internet";
  if (pattern === "alc_internet_down") return "no_internet";

  return issue || "no_internet";
}
