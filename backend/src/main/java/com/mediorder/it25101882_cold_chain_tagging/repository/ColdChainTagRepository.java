package com.mediorder.it25101882_cold_chain_tagging.repository;

import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainSection;
import com.mediorder.it25101882_cold_chain_tagging.model.ColdChainTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ColdChainTagRepository extends JpaRepository<ColdChainTag, Long> {
    Optional<ColdChainTag> findByMedicineId(Long medicineId);
    List<ColdChainTag> findBySection(ColdChainSection section);
    List<ColdChainTag> findByStatus(String status);
}
