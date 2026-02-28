"""
Quick validation test for the credibility scoring engine.
Run with: python test_credibility.py  (from backend/)
No pytest or external services needed.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Set a dummy key so Settings doesn't fail on import
os.environ["GEMINI_API_KEY"] = "test_key"

from app.models.paper import (
    PaperInDB, PaperStatus, ClaimData, EvidencePointer,
    DatasetData, MethodData, MetricResult, LimitationData,
    HyperparameterSignal, ComputeDisclosure
)
from app.services.credibility import compute_credibility
from app.models.credibility import RiskFlag


def make_ideal_paper() -> PaperInDB:
    """A fully transparent, reproducible, high-quality paper."""
    return PaperInDB(
        id="ideal-001",
        title="Ideal Research Paper",
        authors=["Alice Smith", "Bob Jones"],
        abstract="We propose a novel method that achieves state-of-the-art results.",
        year=2024,
        status=PaperStatus.PROCESSED,
        code_link="https://github.com/example/repo",
        data_link="https://huggingface.co/datasets/example",
        baseline="ResNet-50 baseline (He et al., 2016)",
        claims=[
            ClaimData(
                statement="Our model achieves 95.2% accuracy on ImageNet.",
                evidence=[
                    EvidencePointer(section="Results", page=6, snippet="Table 2 shows 95.2% top-1 accuracy."),
                    EvidencePointer(section="Appendix A", page=12, snippet="Ablation study confirms the gain."),
                ]
            ),
        ],
        datasets=[
            DatasetData(name="ImageNet", description="Large-scale vision dataset"),
            DatasetData(name="CIFAR-100", description="100-class image recognition"),
        ],
        methods=[MethodData(name="Transformer Encoder", description="Self-attention based backbone")],
        metrics=[MetricResult(metric_name="Top-1 Accuracy", value="95.2%", dataset="ImageNet", comparison_baseline="ResNet-50: 76.1%")],
        limitations=[LimitationData(description="High compute cost limits deployment on edge devices.")],
        hyperparameters=HyperparameterSignal(disclosed=True, details="lr=0.001, batch=256, epochs=90, optimizer=AdamW"),
        compute=ComputeDisclosure(disclosed=True, gpu_type="A100", gpu_hours=480.0, details="8×A100 for 5 days"),
    )


def make_minimal_paper() -> PaperInDB:
    """A paper with almost nothing disclosed."""
    return PaperInDB(
        id="minimal-001",
        title="Minimal Paper",
        status=PaperStatus.PROCESSED,
    )


def test_ideal_paper():
    paper = make_ideal_paper()
    report = compute_credibility(paper)

    print("\n── IDEAL PAPER ─────────────────────────────────────")
    print(f"  Reproducibility:  {report.reproducibility_score}/100")
    print(f"  Confidence:       {report.confidence_score}/100")
    print(f"  Transparency:     {report.transparency_score}/100")
    print(f"  RCI:              {report.rci}/100  (Grade: {report.grade})")
    print(f"  Risk Flags:       {[f.value for f in report.risk_flags]}")
    print(f"  Effort:           {report.reproduction_effort}")

    # Assertions
    assert report.reproducibility_score == 100, f"Expected 100, got {report.reproducibility_score}"
    assert report.confidence_score >= 90,       f"Expected ≥90, got {report.confidence_score}"
    assert report.grade in ("A", "B"),          f"Expected A/B grade, got {report.grade}"
    assert RiskFlag.NO_CODE_LINK not in report.risk_flags
    assert RiskFlag.MISSING_HYPERPARAMS not in report.risk_flags
    assert report.reproduction_effort == "LOW"
    print("  ✅ All assertions PASSED")


def test_minimal_paper():
    paper = make_minimal_paper()
    report = compute_credibility(paper)

    print("\n── MINIMAL PAPER ───────────────────────────────────")
    print(f"  Reproducibility:  {report.reproducibility_score}/100")
    print(f"  Confidence:       {report.confidence_score}/100")
    print(f"  Transparency:     {report.transparency_score}/100")
    print(f"  RCI:              {report.rci}/100  (Grade: {report.grade})")
    print(f"  Risk Flags ({len(report.risk_flags)}):  {[f.value for f in report.risk_flags]}")
    print(f"  Effort:           {report.reproduction_effort}")

    assert report.reproducibility_score == 0
    assert report.grade == "F"
    assert RiskFlag.NO_CODE_LINK in report.risk_flags
    assert RiskFlag.MISSING_HYPERPARAMS in report.risk_flags
    assert RiskFlag.NO_CLAIMS in report.risk_flags
    assert report.reproduction_effort == "VERY HIGH"
    print("  ✅ All assertions PASSED")


def test_rci_formula():
    """Verify the RCI weighted formula is applied correctly."""
    paper = make_ideal_paper()
    report = compute_credibility(paper)
    expected_rci = round(
        (report.reproducibility_score * 0.50) +
        (report.confidence_score      * 0.30) +
        (report.transparency_score    * 0.20),
        1
    )
    assert report.rci == expected_rci, f"RCI formula mismatch: {report.rci} != {expected_rci}"
    print(f"\n── RCI FORMULA ─────────────────────────────────────")
    print(f"  ({report.reproducibility_score}×0.5) + ({report.confidence_score}×0.3) + ({report.transparency_score}×0.2) = {report.rci}")
    print("  ✅ Formula verified")


if __name__ == "__main__":
    test_ideal_paper()
    test_minimal_paper()
    test_rci_formula()
    print("\n✅ All tests passed!\n")
