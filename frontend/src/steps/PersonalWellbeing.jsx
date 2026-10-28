import { FiCheckCircle } from "react-icons/fi";

function PersonalWellbeing({ formData, handleChange, errors }) {
  return (
    <div className="step-content fade-in">
      <div className="form-grid single-col">
        <div
          className={`form-group ${
            errors.financial_stress ? "has-error" : ""
          }`}
        >
          <label htmlFor="field-financial_stress">
            Financial Stress (0–10) <span className="req">*</span>
          </label>
          <input
            id="field-financial_stress"
            type="number"
            name="financial_stress"
            min="0"
            max="10"
            step="0.1"
            value={formData.financial_stress}
            onChange={handleChange}
            placeholder="Rate from 0 to 10"
            required
          />
          <div className="field-hint">Perceived financial strain scale (0 – 10)</div>
          {errors.financial_stress && (
            <div className="error-message">
              {errors.financial_stress}
            </div>
          )}
        </div>

        <div className="summary-preview">
          <div className="summary-icon">
            <FiCheckCircle />
          </div>
          <div>
            <h4>Everything Looks Complete</h4>
            <p>
              You have completed all sections. Click below to view your personalized burnout evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalWellbeing;
