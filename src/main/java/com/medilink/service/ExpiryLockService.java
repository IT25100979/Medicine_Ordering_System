package com.medilink.service;

import com.medilink.entity.Batch;
import com.medilink.repository.BatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpiryLockService {

    @Autowired
    private BatchRepository batchRepository;

    // runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void lockExpiredBatches() {
        List<Batch> expiredBatches =
                batchRepository.findByExpiryDateBeforeAndLockedFalse(LocalDate.now());

        for (Batch batch : expiredBatches) {
            batch.setLocked(true);
        }
        batchRepository.saveAll(expiredBatches);
    }
}