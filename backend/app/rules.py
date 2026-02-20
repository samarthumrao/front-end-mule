
from pydantic import BaseModel

class DetectionConfig(BaseModel):
    # SMURFING Rules
    fan_out_threshold: int = 10  # Fallback absolute minimum
    fan_in_threshold: int = 10   # Fallback absolute minimum
    degree_outlier_sigma: float = 2.0  # Statistical threshold (Mean + 2*StdDev)

    # CYCLE Rules
    min_cycle_length: int = 3
    max_cycle_length: int = 5

    # TEMPORAL Rules
    temporal_window_hours: int = 72

    # LAYERED SHELL Rules
    shell_min_hops: int = 3
    shell_max_intermediate_tx: int = 3 # Low transaction count for shells
    weight_shell: float = 0.20 # Additional weight

    # LAYERED SHELL Rules
    shell_min_hops: int = 3
    shell_max_intermediate_tx: int = 3 # "2-3 total" from specs

    # PROFILE Rules (New)
    new_account_days: int = 30
    dormancy_days: int = 90

    # SCORING Weights (Target 100 total)
    weight_cycle: float = 0.50       # Reduced to fit shell
    weight_commission: float = 0.15
    weight_smurfing: float = 0.15
    weight_profile: float = 0.05
    weight_shell: float = 0.15       # Added explicit weight in configured section
    
    # Base Scores for Hits
    score_cycle_detected: float = 100.0
    score_commission_retention: float = 100.0
    score_smurf_detected: float = 100.0
    score_shell_detected: float = 100.0  # Added missing field
    score_profile_risk: float = 100.0
    
    # False Positive Reductions
    merchant_deduction: float = 50.0 # Reduce score for likely merchants

# Singleton instance
current_rules = DetectionConfig()
