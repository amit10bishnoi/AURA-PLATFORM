import pandas as pd
import numpy as np

def generate_training_data(n=1000):
    np.random.seed(42)

    has_mfa = np.random.choice([True, False], n, p=[0.6, 0.4])
    mfa_coverage = np.where(has_mfa, np.random.randint(40, 100, n), 0)
    patch_days = np.random.choice([7, 14, 30, 60, 90, 180], n, p=[0.1, 0.15, 0.3, 0.25, 0.15, 0.05])
    training_percent = np.random.randint(10, 100, n)
    has_irp = np.random.choice([True, False], n, p=[0.5, 0.5])
    vulnerabilities = np.random.randint(0, 50, n)
    employees = np.random.randint(10, 500, n)
    industry_codes = np.random.randint(0, 5, n)

    breach_probability = (
        (~has_mfa) * 0.3 +
        (mfa_coverage < 80) * 0.1 +
        (patch_days > 60) * 0.2 +
        (training_percent < 50) * 0.15 +
        (~has_irp) * 0.1 +
        (vulnerabilities > 10) * 0.15 +
        np.random.normal(0, 0.05, n)
    )

    breach_occurred = (breach_probability > 0.4).astype(int)

    df = pd.DataFrame({
        "has_mfa": has_mfa.astype(int),
        "mfa_coverage": mfa_coverage,
        "patch_days": patch_days,
        "training_percent": training_percent,
        "has_irp": has_irp.astype(int),
        "vulnerabilities": vulnerabilities,
        "employees": employees,
        "industry_code": industry_codes,
        "breach_occurred": breach_occurred
    })

    return df


if __name__ == "__main__":
    df = generate_training_data()
    print("Dataset shape:", df.shape)
    print("\nFirst 5 rows:")
    print(df.head())
    print("\nBreach rate:", round(df["breach_occurred"].mean() * 100, 1), "%")
    df.to_csv("training_data.csv", index=False)
    print("\nSaved to training_data.csv")