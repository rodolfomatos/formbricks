/** Infers whether a user-agent string corresponds to a mobile phone or desktop device. */
export const deviceType = (userAgent: string): "desktop" | "phone" =>
  !!userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i)
    ? "phone"
    : "desktop";
