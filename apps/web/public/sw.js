self.addEventListener("push", (event) => {
    let data = {
        title: "GatePulse",
        body: "You have a new visitor request.",
        url: "/resident",
    };

    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch {
        // Keep the fallback notification.
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/gatepulse-icon.svg",
            badge: "/gatepulse-icon.svg",
            data: { url: data.url },
            tag: data.visitorLogId || "gatepulse-visitor",
            requireInteraction: true,
        }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/resident";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ("focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(url);
            }

            return undefined;
        }),
    );
});
