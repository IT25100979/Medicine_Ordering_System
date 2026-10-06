package com.mediorder.dto;

public class SmartInventoryStatsResponse {

    private long totalMedicines;
    private long totalBatches;
    private long totalUnitsInStock;
    private long activeBatches;
    private long nearExpiryBatches;
    private long warningBatches;
    private long expiredBatches;
    private long quarantinedBatches;
    private String fefoEfficiencyScore;

    public SmartInventoryStatsResponse() {}

    public SmartInventoryStatsResponse(long totalMedicines, long totalBatches, long totalUnitsInStock,
                                       long activeBatches, long nearExpiryBatches, long warningBatches,
                                       long expiredBatches, long quarantinedBatches, String fefoEfficiencyScore) {
        this.totalMedicines = totalMedicines;
        this.totalBatches = totalBatches;
        this.totalUnitsInStock = totalUnitsInStock;
        this.activeBatches = activeBatches;
        this.nearExpiryBatches = nearExpiryBatches;
        this.warningBatches = warningBatches;
        this.expiredBatches = expiredBatches;
        this.quarantinedBatches = quarantinedBatches;
        this.fefoEfficiencyScore = fefoEfficiencyScore;
    }

    public long getTotalMedicines() { return totalMedicines; }
    public void setTotalMedicines(long totalMedicines) { this.totalMedicines = totalMedicines; }

    public long getTotalBatches() { return totalBatches; }
    public void setTotalBatches(long totalBatches) { this.totalBatches = totalBatches; }

    public long getTotalUnitsInStock() { return totalUnitsInStock; }
    public void setTotalUnitsInStock(long totalUnitsInStock) { this.totalUnitsInStock = totalUnitsInStock; }

    public long getActiveBatches() { return activeBatches; }
    public void setActiveBatches(long activeBatches) { this.activeBatches = activeBatches; }

    public long getNearExpiryBatches() { return nearExpiryBatches; }
    public void setNearExpiryBatches(long nearExpiryBatches) { this.nearExpiryBatches = nearExpiryBatches; }

    public long getWarningBatches() { return warningBatches; }
    public void setWarningBatches(long warningBatches) { this.warningBatches = warningBatches; }

    public long getExpiredBatches() { return expiredBatches; }
    public void setExpiredBatches(long expiredBatches) { this.expiredBatches = expiredBatches; }

    public long getQuarantinedBatches() { return quarantinedBatches; }
    public void setQuarantinedBatches(long quarantinedBatches) { this.quarantinedBatches = quarantinedBatches; }

    public String getFefoEfficiencyScore() { return fefoEfficiencyScore; }
    public void setFefoEfficiencyScore(String fefoEfficiencyScore) { this.fefoEfficiencyScore = fefoEfficiencyScore; }

    public static SmartInventoryStatsResponseBuilder builder() {
        return new SmartInventoryStatsResponseBuilder();
    }

    public static class SmartInventoryStatsResponseBuilder {
        private long totalMedicines;
        private long totalBatches;
        private long totalUnitsInStock;
        private long activeBatches;
        private long nearExpiryBatches;
        private long warningBatches;
        private long expiredBatches;
        private long quarantinedBatches;
        private String fefoEfficiencyScore;

        public SmartInventoryStatsResponseBuilder totalMedicines(long totalMedicines) { this.totalMedicines = totalMedicines; return this; }
        public SmartInventoryStatsResponseBuilder totalBatches(long totalBatches) { this.totalBatches = totalBatches; return this; }
        public SmartInventoryStatsResponseBuilder totalUnitsInStock(long totalUnitsInStock) { this.totalUnitsInStock = totalUnitsInStock; return this; }
        public SmartInventoryStatsResponseBuilder activeBatches(long activeBatches) { this.activeBatches = activeBatches; return this; }
        public SmartInventoryStatsResponseBuilder nearExpiryBatches(long nearExpiryBatches) { this.nearExpiryBatches = nearExpiryBatches; return this; }
        public SmartInventoryStatsResponseBuilder warningBatches(long warningBatches) { this.warningBatches = warningBatches; return this; }
        public SmartInventoryStatsResponseBuilder expiredBatches(long expiredBatches) { this.expiredBatches = expiredBatches; return this; }
        public SmartInventoryStatsResponseBuilder quarantinedBatches(long quarantinedBatches) { this.quarantinedBatches = quarantinedBatches; return this; }
        public SmartInventoryStatsResponseBuilder fefoEfficiencyScore(String fefoEfficiencyScore) { this.fefoEfficiencyScore = fefoEfficiencyScore; return this; }

        public SmartInventoryStatsResponse build() {
            return new SmartInventoryStatsResponse(totalMedicines, totalBatches, totalUnitsInStock,
                    activeBatches, nearExpiryBatches, warningBatches, expiredBatches, quarantinedBatches, fefoEfficiencyScore);
        }
    }
}
