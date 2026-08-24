# Step 1: Import Libraries

import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from imblearn.over_sampling import SMOTE



# Step 2: Load Dataset

df = pd.read_csv("../dataset/student_mental_health_burnout_100k.csv")



# Step 3: Remove Unnecessary Columns

df = df.drop([
    "burnout_score",
    "mental_health_index",
    "dropout_risk"
], axis=1)



# Step 4: Separate Features and Target

X = df.drop("risk_level", axis=1)
y = df["risk_level"]



# Step 5: Encode Categorical Data

gender_encoder = LabelEncoder()
X["gender"] = gender_encoder.fit_transform(X["gender"])

risk_encoder = LabelEncoder()
y = risk_encoder.fit_transform(y)



# Step 6: Train-Test Split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)



# Step 7: Apply SMOTE

smote = SMOTE(random_state=42)
X_train, y_train = smote.fit_resample(X_train, y_train)



# Step 8: Create Random Forest Model

model = RandomForestClassifier(
    n_estimators=50,
    random_state=42
)



# Step 9: Train Model

model.fit(X_train, y_train)



# Step 10: Prediction

y_pred = model.predict(X_test)



# Step 11: Model Evaluation

accuracy = accuracy_score(y_test, y_pred)

print("Accuracy:", accuracy)

print("\nClassification Report:")
print(classification_report(y_test, y_pred))



# Step 12: Save Model and Encoders

joblib.dump(model, "burnout_model.pkl")
joblib.dump(gender_encoder, "gender_encoder.pkl")
joblib.dump(risk_encoder, "risk_encoder.pkl")

print("\nModel and Encoders Saved Successfully!")