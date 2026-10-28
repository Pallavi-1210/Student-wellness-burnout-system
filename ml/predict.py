import sys
import json
import warnings
from pathlib import Path
import pandas as pd
import joblib

# Suppress warnings so that only explicit JSON is printed to stdout
warnings.filterwarnings("ignore")

FEATURE_ORDER = [
    "age",
    "gender",
    "academic_year",
    "study_hours_per_day",
    "exam_pressure",
    "academic_performance",
    "stress_level",
    "anxiety_score",
    "depression_score",
    "sleep_hours",
    "physical_activity",
    "social_support",
    "screen_time",
    "internet_usage",
    "financial_stress",
    "family_expectation",
]

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("No input data provided to prediction script.")

        # Receive JSON string from CLI argument
        raw_data = sys.argv[1]
        student_data = json.loads(raw_data)

        # Resolve paths dynamically relative to this script file
        base_dir = Path(__file__).resolve().parent

        model_path = base_dir / "burnout_model.pkl"
        gender_encoder_path = base_dir / "gender_encoder.pkl"
        risk_encoder_path = base_dir / "risk_encoder.pkl"

        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        if not gender_encoder_path.exists():
            raise FileNotFoundError(f"Gender encoder not found at: {gender_encoder_path}")
        if not risk_encoder_path.exists():
            raise FileNotFoundError(f"Risk encoder not found at: {risk_encoder_path}")

        # Load trained ML model and encoders
        model = joblib.load(model_path)
        gender_encoder = joblib.load(gender_encoder_path)
        risk_encoder = joblib.load(risk_encoder_path)

        # Prepare and cast features according to expected order and data types
        formatted_record = {}
        for feature in FEATURE_ORDER:
            if feature not in student_data or student_data[feature] is None or student_data[feature] == "":
                raise ValueError(f"Missing required feature: '{feature}'")

            if feature == "gender":
                val = str(student_data["gender"]).strip().capitalize()
                if val not in ["Male", "Female"]:
                    raise ValueError(f"Invalid gender '{student_data['gender']}'. Expected 'Male' or 'Female'.")
                formatted_record[feature] = val
            else:
                try:
                    formatted_record[feature] = float(student_data[feature])
                except (ValueError, TypeError):
                    raise ValueError(f"Feature '{feature}' must be a valid number, received: '{student_data[feature]}'")

        # Create DataFrame with exact column order
        student_df = pd.DataFrame([formatted_record], columns=FEATURE_ORDER)

        # Encode categorical gender feature
        student_df["gender"] = gender_encoder.transform(student_df["gender"])

        # Predict risk level
        prediction = model.predict(student_df)

        # Decode numeric prediction to label ('Low', 'Medium', 'High')
        prediction_labels = risk_encoder.inverse_transform(prediction)
        predicted_risk = str(prediction_labels[0])

        # Output single structured JSON object
        output = {
            "success": True,
            "risk_level": predicted_risk
        }
        print(json.dumps(output))

    except Exception as exc:
        output = {
            "success": False,
            "error": str(exc)
        }
        print(json.dumps(output))
        sys.exit(1)

if __name__ == "__main__":
    main()