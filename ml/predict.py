import sys
import json
import pandas as pd
import joblib

# Node.js se JSON string receive kar rahe hain
data = sys.argv[1]

# JSON string ko Python dictionary me convert kar rahe hain
student_data = json.loads(data)

# Trained ML model ko load kar rahe hain
model = joblib.load(
    "E:\\Student-Burnout-System\\ml\\burnout_model.pkl"
)

# Saved gender encoder ko load kar rahe hain
gender_encoder = joblib.load(
    "E:\\Student-Burnout-System\\ml\\gender_encoder.pkl"
)

# Saved risk encoder ko load kar rahe hain
risk_encoder = joblib.load(
    "E:\\Student-Burnout-System\\ml\\risk_encoder.pkl"
)

# Student data ko Pandas DataFrame me convert kar rahe hain
student_df = pd.DataFrame([student_data])

# Gender ko text se number me convert kar rahe hain
# Example: Female -> 0
student_df["gender"] = gender_encoder.transform(
    student_df["gender"]
)

# Trained model ko student ka data dekar prediction kar rahe hain
prediction = model.predict(student_df)

# Model ke numeric prediction ko readable text me convert kar rahe hain
# Example: 2 -> High
prediction = risk_encoder.inverse_transform(prediction)

# Final prediction Node.js ko output ke through bhej rahe hain
print("Predicted Risk Level:", prediction[0])