package com.mediorder.it25100979_delivery_management.observer;

import com.mediorder.it25100979_delivery_management.event.DeliveryLifecycleEvent;

/**
 * SUBJECT in the Observer design pattern: keeps the list of observers and notifies them.
 */
public interface DeliverySubject {

    void attach(DeliveryObserver observer);

    void detach(DeliveryObserver observer);

    void notifyObservers(DeliveryLifecycleEvent event);
}
