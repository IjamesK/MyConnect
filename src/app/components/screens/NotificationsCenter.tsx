const handleNotificationClick = async (notification: AppNotification) => {
  await markNotificationRead(notification.id);

  if (notification.action) {
    navigate(notification.action);
    return;
  }

  if (notification.type === "ticket" && notification.relatedId) {
    navigate(`/ticket/${notification.relatedId}`);
    return;
  }

  if (
    notification.type === "incident" ||
    notification.type === "maintenance"
  ) {
    navigate("/service-status");
    return;
  }

  if (notification.type === "billing") {
    navigate("/renewal");
  }
{notifications.map((notification) => (
  <button
    key={notification.id}
    type="button"
    onClick={() => handleNotificationClick(notification)}
  >
    ...
  </button>
))}
  
};
