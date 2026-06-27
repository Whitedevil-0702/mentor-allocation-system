import pytest
from backend.app.scoring.engine import calculate_score, get_risk_band

# 10 reference input/output sets mapping (attendance, academic, engagement, placement) -> (expected_score, expected_risk_band)
REFERENCE_DATASETS = [
    # 1. All max
    (100.0, 100.0, 100.0, 100.0, 100.0, "Green"),
    # 2. All zero
    (0.0, 0.0, 0.0, 0.0, 0.0, "Coral"),
    # 3. Exact Green boundary (70.0)
    (70.0, 70.0, 70.0, 70.0, 70.0, "Green"),
    # 4. Exact Amber boundary (50.0)
    (50.0, 50.0, 50.0, 50.0, 50.0, "Amber"),
    # 5. High academics & attendance, moderate engagement & placement
    (80.0, 80.0, 50.0, 50.0, 71.0, "Green"),
    # 6. Moderate metrics resulting in Amber
    (60.0, 60.0, 40.0, 40.0, 54.0, "Amber"),
    # 7. Low metrics resulting in Coral
    (40.0, 40.0, 30.0, 30.0, 37.0, "Coral"),
    # 8. High attendance, lower academics but compensated by engagement/placement (Green)
    (90.0, 50.0, 80.0, 60.0, 70.0, "Green"),
    # 9. Low attendance, higher academics (Amber boundary)
    (45.0, 55.0, 50.0, 50.0, 50.0, "Amber"),
    # 10. Just under Amber boundary (Coral)
    (49.0, 49.0, 50.0, 50.0, 49.3, "Coral")
]

@pytest.mark.parametrize(
    "attendance, academic, engagement, placement, expected_score, expected_risk_band",
    REFERENCE_DATASETS
)
def test_score_calculation_against_reference_sets(
    attendance, academic, engagement, placement, expected_score, expected_risk_band
):
    score = calculate_score(attendance, academic, engagement, placement)
    assert score == expected_score, f"Expected score {expected_score} for inputs ({attendance}, {academic}, {engagement}, {placement}), but got {score}"
    
    risk_band = get_risk_band(score)
    assert risk_band == expected_risk_band, f"Expected risk band '{expected_risk_band}' for score {score}, but got '{risk_band}'"
