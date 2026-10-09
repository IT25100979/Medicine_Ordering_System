package com.mediorder.it25100979_delivery_management.designe_patter.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Small helper for best-effort observers: run side effects (live push, notifications) only once
 * the delivery change is committed, so nobody is told about a change that was rolled back.
 */
public final class AfterCommit {

    private static final Logger log = LoggerFactory.getLogger(AfterCommit.class);

    private AfterCommit() {
    }

    public static void run(Runnable task) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    safeRun(task);
                }
            });
        } else {
            safeRun(task);
        }
    }

    private static void safeRun(Runnable task) {
        try {
            task.run();
        } catch (RuntimeException ex) {
            log.warn("After-commit delivery task failed: {}", ex.getMessage());
        }
    }
}
