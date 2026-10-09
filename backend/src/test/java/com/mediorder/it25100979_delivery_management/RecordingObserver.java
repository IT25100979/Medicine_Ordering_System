package com.mediorder.it25100979_delivery_management;

import com.mediorder.it25100979_delivery_management.event.DeliveryEventType;
import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;
import com.mediorder.it25100979_delivery_management.observer.DeliveryObserver;

import java.util.ArrayList;
import java.util.List;

/** Test observer that remembers every event it receives. */
public class RecordingObserver implements DeliveryObserver {

    public final List<DeliveryLifecycleEvent> events = new ArrayList<>();

    @Override
    public void update(DeliveryLifecycleEvent event) {
        events.add(event);
    }

    public List<DeliveryEventType> types() {
        return events.stream().map(DeliveryLifecycleEvent::type).toList();
    }

    public DeliveryLifecycleEvent last() {
        return events.get(events.size() - 1);
    }
}
